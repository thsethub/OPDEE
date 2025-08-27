# 🏗️ Arquitetura do Sistema - OPDEE

## Visão Geral da Arquitetura

O OPDEE foi projetado seguindo uma arquitetura moderna e escalável, utilizando tecnologias consolidadas para garantir performance, segurança e manutenibilidade.

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITETURA OPDEE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐│
│  │   Mobile App    │    │     Backend     │    │   IoT Layer     ││
│  │  React Native   │◄──►│    Supabase     │◄──►│  MQTT Broker    ││
│  │   (Frontend)    │    │   (Database)    │    │  (IoT Control)  ││
│  └─────────────────┘    └─────────────────┘    └─────────────────┘│
│           │                       │                       │       │
│           │                       │                       │       │
│           ▼                       ▼                       ▼       │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐│
│  │   Navigation    │    │   PostgreSQL    │    │ Electronic      ││
│  │   Authentication│    │   Realtime      │    │ Locks/Doors     ││
│  │   State Mgmt    │    │   API REST      │    │ Hardware        ││
│  └─────────────────┘    └─────────────────┘    └─────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Camadas da Arquitetura

### 1. Camada de Apresentação (Frontend)

#### React Native Application
**Responsabilidades:**
- Interface do usuário
- Navegação entre telas
- Validação de entrada
- Gerenciamento de estado local
- Comunicação com backend

**Componentes Principais:**
```
src/
├── pages/                  # Telas da aplicação
│   ├── Welcome/           # Tela de boas-vindas
│   ├── SingUp/           # Cadastro de usuários
│   ├── Ambientes/        # Lista de ambientes
│   ├── ControleAcesso/   # Controle administrativo
│   └── AppConfig/        # Configurações
├── routes.js             # Navegação e roteamento
└── context/              # Estado global
```

**Tecnologias:**
- **React Native**: Framework mobile multiplataforma
- **React Navigation**: Sistema de navegação
- **React Context**: Gerenciamento de estado
- **Expo**: Plataforma de desenvolvimento

### 2. Camada de Serviços (Backend)

#### Supabase Backend-as-a-Service
**Responsabilidades:**
- Armazenamento de dados
- Autenticação e autorização
- API REST automática
- Tempo real (WebSocket)
- Políticas de segurança

**Serviços Utilizados:**
```
Supabase Services:
├── Database (PostgreSQL)  # Armazenamento principal
├── Auth                  # Autenticação (não usado)
├── Storage              # Armazenamento de arquivos
├── Edge Functions       # Funções serverless
└── Realtime            # Atualizações em tempo real
```

### 3. Camada de Comunicação IoT

#### MQTT Messaging
**Responsabilidades:**
- Comunicação com dispositivos IoT
- Controle de trancas eletrônicas
- Protocolo leve e eficiente
- Tolerância a falhas de rede

**Fluxo de Comunicação:**
```
App → Supabase → MQTT Broker → Electronic Lock
 ↑                                        ↓
 └── Confirmation ← MQTT Response ← Status
```

## Fluxo de Dados

### 1. Autenticação por Dispositivo

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Device    │    │     App     │    │  Supabase   │
│             │    │             │    │             │
│ Get UUID    │───►│ Store UUID  │───►│ Query User  │
│             │    │             │◄───│ Return Data │
│             │    │ Navigate    │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 2. Cadastro de Usuário

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    User     │    │     App     │    │  Supabase   │
│             │    │             │    │             │
│ Fill Form   │───►│ Validate    │───►│ Insert User │
│             │    │             │    │             │
│             │    │             │───►│ Insert      │
│             │    │             │    │ Access Req  │
│             │    │ Show        │◄───│ Return      │
│             │◄───│ Success     │    │ Success     │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 3. Abertura de Ambiente

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    User     │    │     App     │    │  Supabase   │    │ MQTT/Lock   │
│             │    │             │    │             │    │             │
│ Select Env  │───►│ Check       │───►│ Verify      │    │             │
│             │    │ Permission  │    │ Access      │    │             │
│             │    │             │◄───│ Return OK   │    │             │
│             │    │ Send MQTT   │───────────────────────►│ Unlock Door │
│             │◄───│ Confirm     │◄───────────────────────│ Send Status │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## Padrões Arquiteturais

### 1. Component-Based Architecture

**Estrutura dos Componentes:**
```javascript
// Exemplo de componente reutilizável
const CustomPicker = ({ selectedValue, onValueChange, items }) => {
  return (
    <Picker
      selectedValue={selectedValue}
      onValueChange={onValueChange}
      style={styles.picker}
    >
      {items.map((item, index) => (
        <Picker.Item key={index} label={item} value={item} />
      ))}
    </Picker>
  );
};
```

### 2. Context Pattern para Estado Global

**Implementação:**
```javascript
// Context para ID do dispositivo
export const contextDeviceId = createContext();

// Provider component
const DeviceProvider = ({ children }) => {
  const [deviceId, setDeviceId] = useState(null);
  
  return (
    <contextDeviceId.Provider value={deviceId}>
      {children}
    </contextDeviceId.Provider>
  );
};
```

### 3. Repository Pattern para Dados

**Camada de Abstração:**
```javascript
// Service layer para Supabase
class UserService {
  static async getUser(deviceId) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('uuid', deviceId);
    return { data, error };
  }
  
  static async createUser(userData) {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([userData]);
    return { data, error };
  }
}
```

## Segurança

### 1. Autenticação Baseada em Dispositivo

**Vantagens:**
- ✅ Não requer senha
- ✅ Único por dispositivo
- ✅ Difícil de falsificar
- ✅ Experiência fluida

**Implementação:**
```javascript
// Obtenção do ID único
const getDeviceId = async () => {
  let id;
  if (Platform.OS === 'android') {
    id = await Application.getAndroidId();
  } else if (Platform.OS === 'ios') {
    id = await Application.getIosIdForVendorAsync();
  }
  return id;
};
```

### 2. Row Level Security (RLS)

**Políticas de Segurança:**
```sql
-- Usuários só veem seus próprios dados
CREATE POLICY "own_data_only" ON usuarios
FOR SELECT USING (uuid = auth.uid());

-- Apenas admins podem modificar acessos
CREATE POLICY "admin_access_only" ON acessos
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE uuid = auth.uid() 
    AND superuser = true
  )
);
```

### 3. Validação de Dados

**Frontend Validation:**
```javascript
const validateForm = (email, nome) => {
  if (!email.endsWith('@ufpe.br')) {
    throw new Error('Email deve ser institucional');
  }
  if (!nome || nome.length < 3) {
    throw new Error('Nome deve ter pelo menos 3 caracteres');
  }
};
```

## Performance

### 1. Otimizações de Consulta

**Efficient Queries:**
```javascript
// Busca apenas campos necessários
const getEnvironments = async (userId) => {
  const { data } = await supabase
    .from('acessos')
    .select(`
      ambiente_id,
      ativado,
      ambientes(nome, topic, mensagem)
    `)
    .eq('usuario_id', userId)
    .eq('ativado', true);
};
```

### 2. Cache e Estado Local

**State Management:**
```javascript
// Cache local para reduzir consultas
const [environments, setEnvironments] = useState([]);
const [loading, setLoading] = useState(false);

const fetchEnvironments = useCallback(async () => {
  if (environments.length === 0) {
    setLoading(true);
    // Fetch data...
    setLoading(false);
  }
}, [environments]);
```

### 3. Lazy Loading

**Componentes Sob Demanda:**
```javascript
// Carregamento dinâmico de telas
const LazyScreen = lazy(() => import('./pages/HeavyScreen'));

const App = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyScreen />
  </Suspense>
);
```

## Escalabilidade

### 1. Arquitetura Horizontal

**Supabase Auto-scaling:**
- Database scaling automático
- Edge functions distribuídas
- CDN global para assets
- Load balancing automático

### 2. MQTT Clustering

**Broker Clustering:**
```yaml
# Configuração de cluster MQTT
mqtt_cluster:
  nodes:
    - mqtt-broker-1:1883
    - mqtt-broker-2:1883
    - mqtt-broker-3:1883
  load_balancer: round_robin
  failover: automatic
```

### 3. Microservices Ready

**Preparado para Decomposição:**
```
Futuras Decomposições:
├── User Service         # Gerenciamento de usuários
├── Environment Service  # Controle de ambientes
├── Access Service      # Lógica de acessos
├── Notification Service # Notificações
└── Analytics Service   # Métricas e relatórios
```

## Monitoramento e Observabilidade

### 1. Logging Estruturado

**Implementation:**
```javascript
const logger = {
  info: (event, data) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      event,
      data,
      userId: getCurrentUserId()
    }));
  },
  error: (event, error, data) => {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      event,
      error: error.message,
      stack: error.stack,
      data
    }));
  }
};
```

### 2. Métricas de Negócio

**Key Performance Indicators:**
- Total de usuários ativos
- Número de acessos por dia
- Taxa de aprovação de solicitações
- Tempo médio de resposta
- Taxa de falhas de conectividade

### 3. Health Checks

**Monitoramento de Saúde:**
```javascript
const healthCheck = async () => {
  const checks = {
    supabase: await checkSupabaseConnection(),
    mqtt: await checkMqttBroker(),
    app: checkAppStatus()
  };
  
  return {
    status: Object.values(checks).every(c => c) ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  };
};
```

## Backup e Disaster Recovery

### 1. Estratégia de Backup

**Automated Backups:**
- Supabase: Backup automático diário
- Configurações: Versionamento no Git
- Dados críticos: Export regular

### 2. Recovery Procedures

**Plano de Recuperação:**
1. Restaurar banco de dados
2. Redeployar aplicação
3. Reconfigurar MQTT broker
4. Validar funcionalidades críticas

## Considerações Futuras

### 1. Melhorias Planejadas

**Roadmap Técnico:**
- Implementação de cache Redis
- Migração para arquitetura de eventos
- Adição de testes automatizados
- CI/CD pipeline completo

### 2. Escalabilidade Horizontal

**Preparação para Crescimento:**
- Separação de serviços
- Load balancing
- Multiple regions
- Edge computing

### 3. Tecnologias Emergentes

**Avaliação Contínua:**
- GraphQL para APIs mais eficientes
- WebAssembly para performance
- Edge functions para lógica distribuída
- Machine Learning para análise de padrões