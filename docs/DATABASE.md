# 🗄️ Esquema do Banco de Dados - OPDEE

## Visão Geral

O OPDEE utiliza PostgreSQL através do Supabase como sistema de gerenciamento de banco de dados. O schema foi projetado para suportar controle de acesso granular com diferentes tipos de usuários e ambientes.

## Diagrama de Relacionamento

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    usuarios     │    │     acessos     │    │   ambientes     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ uuid (PK)       │◄──┤ usuario_id (FK) │    │ id (PK)         │
│ nome_completo   │    │ ambiente_id (FK)├───►│ nome            │
│ email_ufpe      │    │ ativado         │    │ topic           │
│ superuser       │    │ tipoUsuario     │    │ mensagem        │
└─────────────────┘    │ id (PK)         │    └─────────────────┘
                       └─────────────────┘
                                │
                                │
                       ┌─────────────────┐
                       │   tipoPerfil    │
                       ├─────────────────┤
                       │ id (PK)         │
                       │ nome            │
                       └─────────────────┘

┌─────────────────┐
│  brokerConfig   │
├─────────────────┤
│ id (PK)         │
│ ip_address      │
│ port            │
│ username        │
│ password        │
└─────────────────┘
```

## Definição das Tabelas

### Tabela: `usuarios`

Armazena informações dos usuários do sistema.

| Campo          | Tipo      | Restrições           | Descrição                           |
|----------------|-----------|---------------------|-------------------------------------|
| `uuid`         | TEXT      | PRIMARY KEY, UNIQUE | Identificador único do dispositivo  |
| `nome_completo`| TEXT      | NOT NULL            | Nome completo do usuário            |
| `email_ufpe`   | TEXT      | NOT NULL, UNIQUE    | Email institucional (@ufpe.br)      |
| `superuser`    | BOOLEAN   | DEFAULT FALSE       | Indica se é superusuário            |

#### Índices
```sql
CREATE UNIQUE INDEX idx_usuarios_uuid ON usuarios(uuid);
CREATE UNIQUE INDEX idx_usuarios_email ON usuarios(email_ufpe);
```

#### Políticas RLS
```sql
-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own data" ON usuarios
  FOR SELECT USING (uuid = auth.uid());

-- Apenas superusuários podem inserir novos usuários
CREATE POLICY "Superusers can insert" ON usuarios
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'superuser');
```

### Tabela: `acessos`

Gerencia as permissões de acesso dos usuários aos ambientes.

| Campo         | Tipo      | Restrições           | Descrição                           |
|---------------|-----------|---------------------|-------------------------------------|
| `id`          | BIGINT    | PRIMARY KEY, SERIAL | Identificador único do acesso       |
| `usuario_id`  | TEXT      | NOT NULL, FK        | Referência ao usuário (UUID)       |
| `ambiente_id` | BIGINT    | NOT NULL, FK        | Referência ao ambiente              |
| `ativado`     | BOOLEAN   | DEFAULT FALSE       | Status da permissão de acesso       |
| `tipoUsuario` | TEXT      | NOT NULL            | Tipo de perfil do usuário           |

#### Chaves Estrangeiras
```sql
ALTER TABLE acessos 
  ADD CONSTRAINT fk_acessos_usuario 
  FOREIGN KEY (usuario_id) REFERENCES usuarios(uuid);

ALTER TABLE acessos 
  ADD CONSTRAINT fk_acessos_ambiente 
  FOREIGN KEY (ambiente_id) REFERENCES ambientes(id);
```

#### Índices
```sql
CREATE INDEX idx_acessos_usuario ON acessos(usuario_id);
CREATE INDEX idx_acessos_ambiente ON acessos(ambiente_id);
CREATE UNIQUE INDEX idx_acessos_unique ON acessos(usuario_id, ambiente_id);
```

#### Restrições
```sql
-- Impede solicitações duplicadas para o mesmo usuário/ambiente
ALTER TABLE acessos 
  ADD CONSTRAINT unique_user_environment 
  UNIQUE (usuario_id, ambiente_id);

-- Valida tipos de usuário permitidos
ALTER TABLE acessos 
  ADD CONSTRAINT check_tipo_usuario 
  CHECK (tipoUsuario IN ('Coordenador', 'Professor', 'Servidor', 'Estudante', 'Terceirizado'));
```

### Tabela: `ambientes`

Define os ambientes/laboratórios do sistema.

| Campo      | Tipo      | Restrições           | Descrição                           |
|------------|-----------|---------------------|-------------------------------------|
| `id`       | BIGINT    | PRIMARY KEY, SERIAL | Identificador único do ambiente     |
| `nome`     | TEXT      | NOT NULL, UNIQUE    | Nome do ambiente/laboratório        |
| `topic`    | TEXT      | NOT NULL            | Tópico MQTT para controle           |
| `mensagem` | TEXT      | NOT NULL            | Comando MQTT para abertura          |

#### Índices
```sql
CREATE UNIQUE INDEX idx_ambientes_nome ON ambientes(nome);
CREATE INDEX idx_ambientes_topic ON ambientes(topic);
```

#### Exemplos de dados
```sql
INSERT INTO ambientes (nome, topic, mensagem) VALUES 
  ('Laboratório de Circuitos', 'lab/circuitos/tranca', 'OPEN'),
  ('Laboratório de Eletrônica', 'lab/eletronica/tranca', 'UNLOCK'),
  ('Sala de Professores', 'sala/professores/acesso', 'GRANT_ACCESS');
```

### Tabela: `tipoPerfil`

Define os tipos de perfil disponíveis no sistema.

| Campo  | Tipo      | Restrições           | Descrição                           |
|--------|-----------|---------------------|-------------------------------------|
| `id`   | BIGINT    | PRIMARY KEY, SERIAL | Identificador único do tipo         |
| `nome` | TEXT      | NOT NULL, UNIQUE    | Nome do tipo de perfil              |

#### Dados padrão
```sql
INSERT INTO tipoPerfil (nome) VALUES 
  ('Coordenador'),
  ('Professor'),
  ('Servidor'),
  ('Estudante'),
  ('Terceirizado');
```

### Tabela: `brokerConfig`

Configurações do broker MQTT para comunicação IoT.

| Campo        | Tipo      | Restrições           | Descrição                           |
|--------------|-----------|---------------------|-------------------------------------|
| `id`         | BIGINT    | PRIMARY KEY, SERIAL | Identificador único da configuração |
| `ip_address` | TEXT      | NOT NULL            | Endereço IP do broker MQTT          |
| `port`       | INTEGER   | NOT NULL            | Porta de conexão                    |
| `username`   | TEXT      |                     | Usuário para autenticação          |
| `password`   | TEXT      |                     | Senha para autenticação            |

#### Restrições
```sql
-- Valida formato de IP
ALTER TABLE brokerConfig 
  ADD CONSTRAINT check_ip_format 
  CHECK (ip_address ~* '^([0-9]{1,3}\.){3}[0-9]{1,3}$');

-- Valida porta válida
ALTER TABLE brokerConfig 
  ADD CONSTRAINT check_port_range 
  CHECK (port > 0 AND port <= 65535);
```

## Views Úteis

### `v_user_environments`
Combina dados de usuários, acessos e ambientes.

```sql
CREATE VIEW v_user_environments AS
SELECT 
  u.nome_completo,
  u.email_ufpe,
  amb.nome as ambiente_nome,
  a.ativado,
  a.tipoUsuario,
  amb.topic,
  amb.mensagem
FROM usuarios u
JOIN acessos a ON u.uuid = a.usuario_id
JOIN ambientes amb ON a.ambiente_id = amb.id;
```

### `v_access_summary`
Resumo de acessos por ambiente.

```sql
CREATE VIEW v_access_summary AS
SELECT 
  amb.nome as ambiente,
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN a.ativado THEN 1 END) as usuarios_ativos,
  COUNT(CASE WHEN NOT a.ativado THEN 1 END) as pendentes
FROM ambientes amb
LEFT JOIN acessos a ON amb.id = a.ambiente_id
GROUP BY amb.id, amb.nome;
```

## Funções Stored Procedures

### `grant_access`
Ativa um acesso específico.

```sql
CREATE OR REPLACE FUNCTION grant_access(access_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE acessos 
  SET ativado = TRUE 
  WHERE id = access_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
```

### `revoke_access`
Remove um acesso específico.

```sql
CREATE OR REPLACE FUNCTION revoke_access(access_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM acessos 
  WHERE id = access_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
```

### `check_user_access`
Verifica se um usuário tem acesso a um ambiente.

```sql
CREATE OR REPLACE FUNCTION check_user_access(user_uuid TEXT, environment_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN DEFAULT FALSE;
BEGIN
  SELECT ativado INTO has_access
  FROM acessos 
  WHERE usuario_id = user_uuid 
    AND ambiente_id = environment_id;
  
  RETURN COALESCE(has_access, FALSE);
END;
$$ LANGUAGE plpgsql;
```

## Triggers

### `audit_access_changes`
Registra mudanças na tabela de acessos.

```sql
CREATE TABLE audit_acessos (
  id SERIAL PRIMARY KEY,
  operation TEXT NOT NULL,
  access_id BIGINT,
  old_data JSONB,
  new_data JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  user_id TEXT
);

CREATE OR REPLACE FUNCTION audit_access_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_acessos (operation, access_id, new_data)
    VALUES ('INSERT', NEW.id, row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_acessos (operation, access_id, old_data, new_data)
    VALUES ('UPDATE', NEW.id, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_acessos (operation, access_id, old_data)
    VALUES ('DELETE', OLD.id, row_to_json(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_acessos_trigger
  AFTER INSERT OR UPDATE OR DELETE ON acessos
  FOR EACH ROW EXECUTE FUNCTION audit_access_trigger();
```

## Backup e Migração

### Script de Backup
```sql
-- Backup completo das tabelas principais
\copy usuarios TO 'backup_usuarios.csv' CSV HEADER;
\copy acessos TO 'backup_acessos.csv' CSV HEADER;
\copy ambientes TO 'backup_ambientes.csv' CSV HEADER;
\copy tipoPerfil TO 'backup_tipoPerfil.csv' CSV HEADER;
\copy brokerConfig TO 'backup_brokerConfig.csv' CSV HEADER;
```

### Script de Migração
```sql
-- Migração para adicionar campo de data de criação
ALTER TABLE usuarios ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE acessos ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE ambientes ADD COLUMN created_at TIMESTAMP DEFAULT NOW();

-- Migração para adicionar campo de última atualização
ALTER TABLE usuarios ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE acessos ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE ambientes ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
```

## Consultas Úteis

### Listar usuários pendentes de aprovação
```sql
SELECT 
  u.nome_completo,
  u.email_ufpe,
  amb.nome as ambiente,
  a.tipoUsuario
FROM usuarios u
JOIN acessos a ON u.uuid = a.usuario_id
JOIN ambientes amb ON a.ambiente_id = amb.id
WHERE a.ativado = FALSE;
```

### Estatísticas por tipo de usuário
```sql
SELECT 
  tipoUsuario,
  COUNT(*) as total,
  COUNT(CASE WHEN ativado THEN 1 END) as ativos
FROM acessos
GROUP BY tipoUsuario
ORDER BY total DESC;
```

### Ambientes mais acessados
```sql
SELECT 
  amb.nome,
  COUNT(a.id) as total_usuarios
FROM ambientes amb
LEFT JOIN acessos a ON amb.id = a.ambiente_id
GROUP BY amb.id, amb.nome
ORDER BY total_usuarios DESC;
```