# 🚀 Guia de Configuração - OPDEE

## Pré-requisitos

Antes de começar, certifique-se de ter:

- **Node.js** (versão 18.0.0 ou superior)
- **npm** ou **yarn** (gerenciador de pacotes)
- **Expo CLI** instalado globalmente
- **Git** para controle de versão
- **Dispositivo móvel** Android/iOS ou emulador
- **Conta Supabase** (gratuita disponível)
- **Broker MQTT** configurado (opcional para testes)

## Instalação do Ambiente de Desenvolvimento

### 1. Instalar Node.js e npm

#### Windows
```bash
# Baixe e instale do site oficial: https://nodejs.org/
# Ou use Chocolatey:
choco install nodejs
```

#### macOS
```bash
# Use Homebrew:
brew install node
```

#### Linux (Ubuntu/Debian)
```bash
# Use o gerenciador de pacotes:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Instalar Expo CLI

```bash
npm install -g @expo/cli
```

### 3. Verificar Instalação

```bash
node --version  # Deve mostrar v18.0.0 ou superior
npm --version   # Deve mostrar versão compatível
expo --version  # Deve mostrar versão do Expo CLI
```

## Configuração do Projeto

### 1. Clone o Repositório

```bash
git clone https://github.com/thsethub/OPDEE.git
cd OPDEE
```

### 2. Instalar Dependências

```bash
npm install
```

Caso encontre erros, tente:

```bash
# Limpar cache e reinstalar
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 3. Verificar Dependências

```bash
npm list
```

Todas as dependências devem estar instaladas sem erros.

## Configuração do Backend (Supabase)

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Preencha os dados:
   - **Name**: OPDEE
   - **Database Password**: Escolha uma senha forte
   - **Region**: Selecione a região mais próxima
5. Clique em "Create new project"

### 2. Configurar Banco de Dados

#### 2.1. Criar Tabelas

Execute os comandos SQL no SQL Editor do Supabase:

```sql
-- Tabela de usuários
CREATE TABLE usuarios (
  uuid TEXT PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  email_ufpe TEXT NOT NULL UNIQUE,
  superuser BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de ambientes/laboratórios
CREATE TABLE ambientes (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  topic TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de tipos de perfil
CREATE TABLE tipoPerfil (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE
);

-- Tabela de acessos
CREATE TABLE acessos (
  id BIGSERIAL PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(uuid),
  ambiente_id BIGINT NOT NULL REFERENCES ambientes(id),
  ativado BOOLEAN DEFAULT FALSE,
  tipoUsuario TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, ambiente_id)
);

-- Tabela de configuração do broker MQTT
CREATE TABLE brokerConfig (
  id BIGSERIAL PRIMARY KEY,
  ip_address TEXT NOT NULL,
  port INTEGER NOT NULL CHECK (port > 0 AND port <= 65535),
  username TEXT,
  password TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2.2. Inserir Dados Iniciais

```sql
-- Tipos de perfil
INSERT INTO tipoPerfil (nome) VALUES 
  ('Coordenador'),
  ('Professor'),
  ('Servidor'),
  ('Estudante'),
  ('Terceirizado');

-- Ambientes de exemplo
INSERT INTO ambientes (nome, topic, mensagem) VALUES 
  ('Laboratório de Circuitos', 'lab/circuitos/tranca', 'OPEN'),
  ('Laboratório de Eletrônica', 'lab/eletronica/tranca', 'UNLOCK'),
  ('Sala de Professores', 'sala/professores/acesso', 'GRANT_ACCESS'),
  ('Laboratório de Sistemas Digitais', 'lab/digital/controle', 'OPEN_DOOR');

-- Configuração inicial do broker (ajuste conforme necessário)
INSERT INTO brokerConfig (ip_address, port, username, password) VALUES 
  ('192.168.1.100', 1883, 'opdee_user', 'senha_mqtt');
```

#### 2.3. Configurar RLS (Row Level Security)

```sql
-- Habilitar RLS nas tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE acessos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambientes ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajuste conforme necessário)
CREATE POLICY "Allow all for development" ON usuarios FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON acessos FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON ambientes FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON tipoPerfil FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON brokerConfig FOR ALL USING (true);
```

### 3. Obter Credenciais

1. No dashboard do Supabase, vá em "Settings" > "API"
2. Copie:
   - **Project URL**
   - **Anon public key**

### 4. Configurar Credenciais no Projeto

Edite o arquivo `services/supabase.js`:

```javascript
import 'react-native-url-polyfill';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'SUA_PROJECT_URL_AQUI';
const supabaseKey = 'SUA_ANON_KEY_AQUI';

export const supabase = createClient(supabaseUrl, supabaseKey);
```

## Configuração do Broker MQTT (Opcional)

### Opção 1: Usar Mosquitto (Local)

#### Instalação

```bash
# Ubuntu/Debian
sudo apt-get install mosquitto mosquitto-clients

# macOS
brew install mosquitto

# Windows
# Baixe de: https://mosquitto.org/download/
```

#### Configuração Básica

```bash
# Criar arquivo de configuração
sudo nano /etc/mosquitto/conf.d/opdee.conf
```

Conteúdo do arquivo:

```
# Configuração básica para OPDEE
listener 1883 0.0.0.0
allow_anonymous false
password_file /etc/mosquitto/passwd

# Logs
log_dest file /var/log/mosquitto/mosquitto.log
log_type error
log_type warning
log_type notice
log_type information
```

#### Criar Usuário

```bash
# Criar arquivo de senhas
sudo mosquitto_passwd -c /etc/mosquitto/passwd opdee_user

# Reiniciar serviço
sudo systemctl restart mosquitto
sudo systemctl enable mosquitto
```

### Opção 2: Usar Broker Online

#### HiveMQ Cloud (Gratuito)
1. Acesse [hivemq.com](https://www.hivemq.com/mqtt-cloud-broker/)
2. Crie uma conta gratuita
3. Configure cluster
4. Obtenha credenciais

#### Eclipse IoT (Público)
- **Host**: `iot.eclipse.org`
- **Port**: `1883`
- **Username**: Não necessário
- **Password**: Não necessário

## Executando a Aplicação

### 1. Iniciar o Servidor de Desenvolvimento

```bash
npm start
```

ou

```bash
expo start
```

### 2. Executar no Dispositivo

#### Usando Expo Go (Recomendado para desenvolvimento)

1. Instale o app "Expo Go" no seu dispositivo
2. Escaneie o QR code mostrado no terminal
3. O app será carregado automaticamente

#### Android

```bash
npm run android
```

#### iOS

```bash
npm run ios
```

### 3. Verificar Funcionamento

1. **Teste de Conexão**: Verifique se o app conecta com Supabase
2. **Cadastro**: Tente criar um novo usuário
3. **MQTT**: Teste conectividade com broker (se configurado)

## Configuração de Produção

### 1. Variáveis de Ambiente

Crie arquivo `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=sua_url_aqui
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_key_aqui
EXPO_PUBLIC_MQTT_HOST=seu_broker_mqtt
EXPO_PUBLIC_MQTT_PORT=1883
```

### 2. Build para Produção

```bash
# Android
eas build --platform android

# iOS
eas build --platform ios

# Ambos
eas build --platform all
```

### 3. Deploy

```bash
# Update over-the-air
eas update

# Submit para stores
eas submit --platform android
eas submit --platform ios
```

## Solução de Problemas

### Erro: "Module not found"

```bash
# Limpar cache e reinstalar
npm cache clean --force
rm -rf node_modules
npm install
```

### Erro: "Supabase connection failed"

1. Verifique as credenciais em `services/supabase.js`
2. Confirme se o projeto Supabase está ativo
3. Teste conectividade de rede

### Erro: "MQTT connection failed"

1. Verifique se o broker está rodando
2. Confirme IP e porta corretos
3. Teste credenciais de autenticação

### Erro: "Expo command not found"

```bash
# Reinstalar Expo CLI
npm uninstall -g @expo/cli
npm install -g @expo/cli
```

### Performance lenta

1. Feche outros apps
2. Reinicie o Metro bundler
3. Use `--clear` flag: `expo start --clear`

## Configurações Avançadas

### Certificados SSL para MQTT

```javascript
// Para uso com MQTT sobre SSL/TLS
const mqttOptions = {
  protocol: 'mqtts',
  port: 8883,
  ca: fs.readFileSync('path/to/ca.crt'),
  cert: fs.readFileSync('path/to/client.crt'),
  key: fs.readFileSync('path/to/client.key')
};
```

### Políticas RLS Avançadas

```sql
-- Usuários só podem ver seus próprios dados
CREATE POLICY "Users own data" ON usuarios
  FOR ALL USING (uuid = current_setting('app.user_id'));

-- Coordenadores podem ver todos os acessos
CREATE POLICY "Coordinators see all" ON acessos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM acessos a2 
      WHERE a2.usuario_id = current_setting('app.user_id') 
      AND a2.tipoUsuario = 'Coordenador'
    )
  );
```

### Monitoramento

```javascript
// Adicionar logging personalizado
const logger = {
  info: (message) => console.log(`[INFO] ${new Date().toISOString()}: ${message}`),
  error: (message) => console.error(`[ERROR] ${new Date().toISOString()}: ${message}`),
  warn: (message) => console.warn(`[WARN] ${new Date().toISOString()}: ${message}`)
};
```

## Próximos Passos

Após a configuração básica:

1. **Configure notificações push** usando Expo Notifications
2. **Implemente analytics** com Firebase ou similar
3. **Configure monitoramento** de erros com Sentry
4. **Adicione testes** unitários e de integração
5. **Configure CI/CD** para deploys automatizados