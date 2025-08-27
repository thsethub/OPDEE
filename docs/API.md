# 📡 Documentação da API - OPDEE

## Visão Geral

O OPDEE utiliza o Supabase como backend, fornecendo uma API REST automaticamente gerada baseada no esquema do banco de dados PostgreSQL.

## Configuração da Conexão

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://amrmswsdehrpihnmbcrg.supabase.co';
const supabaseKey = 'YOUR_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);
```

## Endpoints Principais

### Usuários (`usuarios`)

#### Buscar usuário por UUID
```javascript
const { data, error } = await supabase
  .from('usuarios')
  .select('uuid, nome_completo, email_ufpe, superuser')
  .eq('uuid', deviceId);
```

#### Criar novo usuário
```javascript
const { data, error } = await supabase
  .from('usuarios')
  .insert([{
    uuid: deviceId,
    nome_completo: nomeCompleto,
    email_ufpe: email
  }]);
```

### Acessos (`acessos`)

#### Buscar acessos por usuário
```javascript
const { data, error } = await supabase
  .from('acessos')
  .select('ambiente_id, ativado, tipoUsuario')
  .eq('usuario_id', deviceId);
```

#### Criar solicitação de acesso
```javascript
const { data, error } = await supabase
  .from('acessos')
  .insert([{
    usuario_id: deviceId,
    ambiente_id: ambienteId,
    ativado: false,
    tipoUsuario: selectedUser
  }]);
```

#### Atualizar status de ativação
```javascript
const { data, error } = await supabase
  .from('acessos')
  .update({ ativado: true })
  .eq('id', solicitacaoId);
```

#### Deletar acesso
```javascript
const { data, error } = await supabase
  .from('acessos')
  .delete()
  .eq('id', id);
```

### Ambientes (`ambientes`)

#### Listar todos os ambientes
```javascript
const { data, error } = await supabase
  .from('ambientes')
  .select('nome');
```

#### Buscar ambiente por IDs
```javascript
const { data, error } = await supabase
  .from('ambientes')
  .select('id, nome, topic, mensagem')
  .in('id', ambienteIds);
```

#### Buscar ambiente por nome
```javascript
const { data, error } = await supabase
  .from('ambientes')
  .select('id')
  .eq('nome', nomeAmbiente);
```

### Tipos de Perfil (`tipoPerfil`)

#### Listar tipos de perfil
```javascript
const { data, error } = await supabase
  .from('tipoPerfil')
  .select('nome');
```

### Configuração do Broker (`brokerConfig`)

#### Buscar configuração do broker
```javascript
const { data, error } = await supabase
  .from('brokerConfig')
  .select('*')
  .single();
```

#### Atualizar configuração do broker
```javascript
const { data, error } = await supabase
  .from('brokerConfig')
  .update(updatedBroker)
  .eq('id', broker.id)
  .single();
```

## Tempo Real (Realtime)

### Subscrever mudanças na tabela de usuários
```javascript
const channel = supabase
  .channel('custom-all-channel')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'usuarios' 
  }, payload => {
    console.log('Novo usuário:', payload.new);
  })
  .subscribe();
```

### Subscrever mudanças na tabela de acessos
```javascript
const subscription = supabase
  .channel('public:acessos')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'acessos' 
  }, payload => {
    console.log('Mudança detectada:', payload);
  })
  .subscribe();
```

### Cancelar subscrição
```javascript
supabase.removeChannel(channel);
```

## Tratamento de Erros

### Exemplo de tratamento básico
```javascript
const { data, error } = await supabase
  .from('usuarios')
  .select('*');

if (error) {
  console.error('Erro na consulta:', error.message);
  return;
}

// Processar dados
console.log('Dados recebidos:', data);
```

### Códigos de erro comuns
- `PGRST301`: Tabela não encontrada
- `PGRST202`: Nenhum resultado encontrado
- `PGRST204`: Violação de restrição

## Autenticação e Segurança

### Row Level Security (RLS)
O Supabase permite configurar políticas de segurança a nível de linha:

```sql
-- Política para usuários verem apenas seus próprios dados
CREATE POLICY "Users can view own data" ON usuarios
  FOR SELECT USING (uuid = auth.uid());
```

### Chaves de API
- **Anon Key**: Para acesso público (usado no app)
- **Service Role Key**: Para operações administrativas

## Limites e Considerações

### Limites da API
- **Taxa de requisições**: 1000 req/min por IP
- **Tamanho máximo**: 1MB por requisição
- **Timeout**: 30 segundos

### Boas Práticas
1. **Use select específico**: Evite `select('*')` em produção
2. **Implemente paginação**: Para grandes volumes de dados
3. **Cache resultados**: Para dados que mudam pouco
4. **Trate erros**: Sempre verifique o campo `error`

## Exemplos de Uso Completos

### Fluxo de autenticação
```javascript
const authenticateUser = async (deviceId) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('uuid, nome_completo, email_ufpe')
      .eq('uuid', deviceId);

    if (error) throw error;

    if (data && data.length > 0) {
      return { authenticated: true, user: data[0] };
    } else {
      return { authenticated: false, user: null };
    }
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return { authenticated: false, error: error.message };
  }
};
```

### Buscar ambientes do usuário
```javascript
const getUserEnvironments = async (deviceId) => {
  try {
    // Buscar acessos do usuário
    const { data: accessData, error: accessError } = await supabase
      .from('acessos')
      .select('ambiente_id, ativado, tipoUsuario')
      .eq('usuario_id', deviceId);

    if (accessError) throw accessError;

    if (accessData.length === 0) return [];

    // Buscar dados dos ambientes
    const ambienteIds = accessData.map(access => access.ambiente_id);
    const { data: ambientesData, error: ambientesError } = await supabase
      .from('ambientes')
      .select('id, nome, topic, mensagem')
      .in('id', ambienteIds);

    if (ambientesError) throw ambientesError;

    // Combinar dados
    const combinedData = accessData.map(access => {
      const ambiente = ambientesData.find(amb => amb.id === access.ambiente_id);
      return {
        ...access,
        nome: ambiente?.nome || 'Desconhecido',
        topic: ambiente?.topic || '',
        mensagem: ambiente?.mensagem || ''
      };
    });

    return combinedData;
  } catch (error) {
    console.error('Erro ao buscar ambientes:', error);
    return [];
  }
};
```