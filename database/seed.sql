-- Datos base: roles (áreas) y canales iniciales.
-- El primer usuario Admin se crea con: npm run seed:admin (en /backend).
BEGIN;

INSERT INTO roles (name, description) VALUES
    ('Admin',          'Administrador del sistema'),
    ('Servicio',       'Servicio / Mano de obra'),
    ('Automatismos',   'Automatismos / Sistemas'),
    ('Administracion', 'Administración / Finanzas'),
    ('RRHH',           'Recursos Humanos'),
    ('Coordinacion',   'Coordinación de tareas'),
    ('Gerencia',       'Gerencia')
ON CONFLICT (name) DO NOTHING;

-- Canales globales (target_role_id NULL => todos los empleados)
INSERT INTO groups (name, description, is_announcement_only, target_role_id) VALUES
    ('Avisos de RRHH', 'Comunicados oficiales de Recursos Humanos (solo lectura)', TRUE,  NULL),
    ('General',        'Conversación general de la empresa',                       FALSE, NULL)
ON CONFLICT (name) DO NOTHING;

-- Un canal por área operativa
INSERT INTO groups (name, description, is_announcement_only, target_role_id)
SELECT v.group_name, v.group_description, FALSE, r.id
FROM (VALUES
    ('Servicio / Mano de obra',   'Coordinación operativa del equipo de servicio',   'Servicio'),
    ('Automatismos / Sistemas',   'Equipo de automatismos y sistemas',               'Automatismos'),
    ('Administración / Finanzas', 'Equipo de administración y finanzas',             'Administracion'),
    ('RRHH',                      'Equipo de Recursos Humanos',                      'RRHH'),
    ('Coordinación de tareas',    'Asignación y seguimiento de tareas',              'Coordinacion'),
    ('Gerencia',                  'Canal de gerencia',                               'Gerencia')
) AS v (group_name, group_description, role_name)
JOIN roles r ON r.name = v.role_name
ON CONFLICT (name) DO NOTHING;

COMMIT;
