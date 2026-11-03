-- =====================================================================
-- Red Social Empresarial - Esquema PostgreSQL (>= 13)
-- Uso: psql "$DATABASE_URL" -f database/schema.sql
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------------
-- roles: cada rol equivale a un área operativa (más el rol técnico Admin)
-- ---------------------------------------------------------------------
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,   -- clave estable usada por el código (p.ej. 'RRHH')
    description VARCHAR(255) NOT NULL           -- etiqueta visible (p.ej. 'Recursos Humanos')
);

-- ---------------------------------------------------------------------
-- users: creados únicamente desde el panel administrativo
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id       INTEGER      NOT NULL REFERENCES roles (id) ON DELETE RESTRICT,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX users_email_lower_uq ON users (LOWER(email));
CREATE INDEX users_role_id_idx ON users (role_id);

-- ---------------------------------------------------------------------
-- groups: canales de chat. target_role_id NULL => visible para todos los roles
-- ---------------------------------------------------------------------
CREATE TABLE groups (
    id                   SERIAL PRIMARY KEY,
    name                 VARCHAR(120) NOT NULL UNIQUE,
    description          VARCHAR(500) NOT NULL DEFAULT '',
    is_announcement_only BOOLEAN      NOT NULL DEFAULT FALSE,  -- solo RRHH/Admin escriben
    target_role_id       INTEGER REFERENCES roles (id) ON DELETE RESTRICT,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX groups_target_role_id_idx ON groups (target_role_id);

-- ---------------------------------------------------------------------
-- user_groups: membresía (se sincroniza automáticamente según el rol)
-- ---------------------------------------------------------------------
CREATE TABLE user_groups (
    user_id   INTEGER     NOT NULL REFERENCES users (id)  ON DELETE CASCADE,
    group_id  INTEGER     NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, group_id)
);
CREATE INDEX user_groups_group_id_idx ON user_groups (group_id);

-- ---------------------------------------------------------------------
-- messages: parent_message_id permite hilos / respuestas
-- ---------------------------------------------------------------------
CREATE TABLE messages (
    id                BIGSERIAL PRIMARY KEY,
    group_id          INTEGER     NOT NULL REFERENCES groups (id)   ON DELETE CASCADE,
    sender_id         INTEGER     NOT NULL REFERENCES users (id)    ON DELETE RESTRICT,
    content           TEXT        NOT NULL
                      CHECK (LENGTH(BTRIM(content)) > 0 AND LENGTH(content) <= 4000),
    parent_message_id BIGINT      REFERENCES messages (id)          ON DELETE SET NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX messages_group_id_id_idx ON messages (group_id, id DESC);
CREATE INDEX messages_sender_id_idx   ON messages (sender_id);
CREATE INDEX messages_parent_idx      ON messages (parent_message_id);

-- ---------------------------------------------------------------------
-- audit_logs: trazabilidad de acciones administrativas
-- ---------------------------------------------------------------------
CREATE TABLE audit_logs (
    id             BIGSERIAL PRIMARY KEY,
    admin_id       INTEGER      NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    action         VARCHAR(60)  NOT NULL,
    target_user_id INTEGER      REFERENCES users (id) ON DELETE SET NULL,
    details        JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX audit_logs_admin_id_idx   ON audit_logs (admin_id);
CREATE INDEX audit_logs_target_idx     ON audit_logs (target_user_id);
CREATE INDEX audit_logs_created_at_idx ON audit_logs (created_at DESC);

-- ---------------------------------------------------------------------
-- Trigger: mantiene users.updated_at
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
