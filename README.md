# 🔐 OPDEE - Sistema de Controle de Acesso

**OPDEE** é uma ferramenta desenvolvida para gerenciar o controle de acesso aos ambientes e laboratórios do Departamento de Engenharia Elétrica da UFPE, permitindo o controle inteligente de trancas eletrônicas através de dispositivos móveis.

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [📚 Documentação Completa](#-documentação-completa)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura do Sistema](#️-arquitetura-do-sistema)
- [Instalação](#-instalação)
- [Configuração](#️-configuração)
- [Uso da Aplicação](#-uso-da-aplicação)
- [Perfis de Usuário](#-perfis-de-usuário)
- [Banco de Dados](#️-banco-de-dados)
- [Tecnologias Utilizadas](#️-tecnologias-utilizadas)
- [Prototipagem](#-prototipagem)

## 📚 Documentação Completa

Esta é uma visão geral do projeto. Para documentação técnica detalhada, consulte:

### 📖 Guias Principais
- **[📋 Índice da Documentação](docs/README.md)** - Portal central da documentação
- **[📖 Manual do Usuário](docs/USER_GUIDE.md)** - Guia completo para usuários finais
- **[🚀 Guia de Configuração](docs/SETUP.md)** - Instalação e configuração detalhada

### 🛠️ Documentação Técnica
- **[🏗️ Arquitetura do Sistema](docs/ARCHITECTURE.md)** - Estrutura e padrões técnicos
- **[📡 Documentação da API](docs/API.md)** - Endpoints e integração com Supabase
- **[🗄️ Esquema do Banco de Dados](docs/DATABASE.md)** - Estrutura completa do banco

> 💡 **Dica**: Comece pelo [Índice da Documentação](docs/README.md) para encontrar exatamente o que precisa!

## 🎯 Visão Geral

O OPDEE é um sistema de controle de acesso baseado em aplicativo móvel que permite:

- **Autenticação por dispositivo**: Cada dispositivo móvel é identificado unicamente
- **Controle granular de acesso**: Diferentes níveis de permissão por ambiente
- **Gerenciamento centralizado**: Interface administrativa para controle de usuários
- **Comunicação IoT**: Integração MQTT para controle das trancas eletrônicas
- **Interface intuitiva**: Design responsivo e amigável

## 🚀 Funcionalidades

### Para Usuários Finais
- **Cadastro de Usuário**: Registro com nome completo e email institucional
- **Solicitação de Acesso**: Requisição de permissão para ambientes específicos
- **Acesso a Ambientes**: Abertura de trancas através do aplicativo
- **Visualização de Permissões**: Lista de ambientes acessíveis

### Para Administradores
- **Gestão de Usuários**: Aprovação/negação de solicitações de acesso
- **Controle de Perfis**: Atribuição de tipos de usuário (Coordenador, Professor, etc.)
- **Gerenciamento de Ambientes**: Cadastro e configuração de laboratórios
- **Configuração do Sistema**: Ajustes de broker MQTT e parâmetros gerais

### Para Coordenadores
- **Acesso Prioritário**: Visualização privilegiada na lista de ambientes
- **Controle Administrativo**: Funcionalidades especiais de gerenciamento

## 🏗️ Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Aplicativo    │◄──►│    Supabase     │◄──►│   Broker MQTT   │
│   React Native  │    │   (Backend)     │    │  (IoT Control)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Autenticação   │    │  Base de Dados  │    │ Trancas Eletr.  │
│  por Dispositivo│    │   PostgreSQL    │    │   dos Labs      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📱 Instalação

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm ou yarn
- Expo CLI
- Dispositivo Android/iOS ou emulador

### Passos da Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/thsethub/OPDEE.git
cd OPDEE
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
# Configure o arquivo services/supabase.js com suas credenciais
```

4. **Execute a aplicação**
```bash
# Para desenvolvimento
npm start

# Para Android
npm run android

# Para iOS
npm run ios
```

## ⚙️ Configuração

### Configuração do Supabase

1. **Crie um projeto no Supabase**
2. **Configure as tabelas do banco de dados** (veja seção [Banco de Dados](#️-banco-de-dados))
3. **Atualize as credenciais** em `services/supabase.js`:

```javascript
const supabaseUrl = 'SUA_URL_DO_SUPABASE';
const supabaseKey = 'SUA_CHAVE_ANONIMA_DO_SUPABASE';
```

### Configuração do Broker MQTT

O sistema permite configurar o broker MQTT através da interface administrativa:

- **IP Address**: Endereço do servidor MQTT
- **Port**: Porta de conexão (padrão: 1883)
- **Username/Password**: Credenciais de autenticação
- **Topics**: Configuração por ambiente

## 📖 Uso da Aplicação

### Primeiro Acesso
1. **Abra o aplicativo** no dispositivo móvel
2. **Cadastre-se** fornecendo nome completo e email institucional (@ufpe.br)
3. **Selecione o ambiente** que deseja acessar
4. **Escolha seu tipo de usuário** (Professor, Estudante, etc.)
5. **Aguarde aprovação** do administrador

### Acesso a Ambientes
1. **Faça login** (automático por dispositivo)
2. **Visualize ambientes disponíveis** na tela principal
3. **Toque no ambiente** que deseja acessar
4. **Confirme a abertura** da tranca
5. **Aguarde a confirmação** do sistema

### Solicitação de Novos Acessos
1. **Acesse "Solicitar acesso"** na tela principal
2. **Selecione o novo ambiente** desejado
3. **Confirme seu tipo de usuário**
4. **Envie a solicitação** para aprovação

## 👥 Perfis de Usuário

O sistema possui 5 tipos de perfil com diferentes níveis de acesso:

### 🎯 Coordenador
- **Acesso total** a todos os ambientes
- **Prioridade na listagem** de ambientes
- **Funções administrativas** especiais

### 👨‍🏫 Professor
- **Acesso a laboratórios** de sua área
- **Permissões elevadas** em ambientes específicos

### 👷 Servidor
- **Acesso administrativo** a áreas técnicas
- **Permissões de manutenção**

### 🎓 Estudante
- **Acesso básico** a laboratórios
- **Sujeito a horários** e restrições

### 🔧 Terceirizado
- **Acesso limitado** a áreas específicas
- **Permissões temporárias**

## 🗄️ Banco de Dados

### Estrutura das Tabelas

#### `usuarios`
```sql
- uuid (TEXT) - ID único do dispositivo
- nome_completo (TEXT) - Nome completo do usuário
- email_ufpe (TEXT) - Email institucional
- superuser (BOOLEAN) - Indica se é superusuário
```

#### `acessos`
```sql
- id (BIGINT) - Chave primária
- usuario_id (TEXT) - Referência ao usuário
- ambiente_id (BIGINT) - Referência ao ambiente
- ativado (BOOLEAN) - Status da permissão
- tipoUsuario (TEXT) - Tipo de perfil do usuário
```

#### `ambientes`
```sql
- id (BIGINT) - Chave primária
- nome (TEXT) - Nome do ambiente/laboratório
- topic (TEXT) - Tópico MQTT para controle
- mensagem (TEXT) - Mensagem de comando MQTT
```

#### `tipoPerfil`
```sql
- id (BIGINT) - Chave primária
- nome (TEXT) - Nome do tipo de perfil
```

#### `brokerConfig`
```sql
- id (BIGINT) - Chave primária
- ip_address (TEXT) - IP do broker MQTT
- port (INTEGER) - Porta do broker
- username (TEXT) - Usuário de autenticação
- password (TEXT) - Senha de autenticação
```

## 🛠️ Tecnologias Utilizadas

### Frontend Mobile
- **[React Native](https://reactnative.dev/)** - Framework de desenvolvimento mobile
- **[Expo](https://expo.dev/)** - Plataforma de desenvolvimento e deploy
- **[React Navigation](https://reactnavigation.org/)** - Navegação entre telas
- **[React Native Animatable](https://github.com/oblador/react-native-animatable)** - Animações

### Backend e Banco de Dados
- **[Supabase](https://supabase.com/)** - Backend as a Service
- **[PostgreSQL](https://www.postgresql.org/)** - Banco de dados relacional
- **[Realtime Subscriptions](https://supabase.com/docs/guides/realtime)** - Atualizações em tempo real

### Comunicação IoT
- **[Paho MQTT](https://www.eclipse.org/paho/)** - Cliente MQTT para JavaScript
- **[MQTT Protocol](https://mqtt.org/)** - Protocolo de comunicação IoT

### Ferramentas de Desenvolvimento
- **[Expo Application](https://docs.expo.dev/versions/latest/sdk/application/)** - ID único do dispositivo
- **[Expo Secure Store](https://docs.expo.dev/versions/latest/sdk/securestore/)** - Armazenamento seguro

## 🎨 Prototipagem

O aplicativo foi desenvolvido com base em protótipo validado:

**Protótipo Figma**: [Visualizar Design](https://www.figma.com/proto/c8Iu7IsOIOfovXc1zNv89Z/Branch---ETE?node-id=52-214&t=CvF9HoVou4iDcKUf-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1)

O protótipo inclui:
- **Fluxo completo** do usuário
- **Interface responsiva** para diferentes tamanhos de tela
- **Design consistente** com identidade visual da UFPE
- **Experiência otimizada** para uso em laboratórios

## 🔧 Resolução de Problemas

### Problemas Comuns

#### Erro de Conexão com Supabase
```bash
# Verifique se as credenciais estão corretas
# Confirme se o projeto Supabase está ativo
# Teste a conectividade de rede
```

#### Falha na Conexão MQTT
```bash
# Verifique as configurações do broker
# Confirme se o broker está acessível
# Teste as credenciais de autenticação
```

#### Problemas de Autenticação
```bash
# Limpe o cache do aplicativo
# Reinstale a aplicação
# Verifique se o dispositivo está registrado
```

## 📚 FAQ (Perguntas Frequentes)

### Como solicitar acesso a um novo ambiente?
1. Entre no aplicativo
2. Toque em "Solicitar acesso"
3. Selecione o ambiente desejado
4. Aguarde aprovação do administrador

### Por que meu acesso foi negado?
- Verifique se você possui as permissões necessárias
- Confirme se seu perfil está correto
- Entre em contato com o administrador

### Como alterar meu tipo de usuário?
- Apenas administradores podem alterar tipos de usuário
- Solicite a alteração através dos canais oficiais

### O que fazer se a tranca não abrir?
1. Verifique sua conexão com a internet
2. Confirme se o ambiente está ativo
3. Tente novamente após alguns segundos
4. Entre em contato com o suporte técnico

## 🔄 Atualizações do Sistema

### Versão 1.0.0 (Atual)
- ✅ Sistema de autenticação por dispositivo
- ✅ Controle de acesso granular
- ✅ Interface administrativa
- ✅ Integração MQTT
- ✅ Suporte a múltiplos perfis de usuário

### Próximas Funcionalidades
- 🔄 Sistema de logs de acesso
- 🔄 Notificações push
- 🔄 Agendamento de acessos
- 🔄 Relatórios de uso
- 🔄 Integração com sistema acadêmico

## 🤝 Contribuição

Para contribuir com o projeto:

1. **Fork** o repositório
2. **Crie uma branch** para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. **Commit** suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. **Push** para a branch (`git push origin feature/NovaFuncionalidade`)
5. **Abra um Pull Request**

### Diretrizes de Contribuição
- Siga os padrões de código estabelecidos
- Documente novas funcionalidades
- Teste suas implementações
- Mantenha a compatibilidade com versões anteriores

## 📞 Suporte

### Contatos
- **Desenvolvedor**: [Thiago Augusto](https://github.com/thsethub)
- **Departamento**: Engenharia Elétrica - UFPE
- **Email**: [Contato institucional]

### Reportar Problemas
Para reportar bugs ou solicitar funcionalidades:
1. Acesse a seção [Issues](https://github.com/thsethub/OPDEE/issues)
2. Descreva detalhadamente o problema
3. Inclua logs e screenshots quando aplicável
4. Aguarde o retorno da equipe

## 📋 Checklist de Deploy

Para ambientes de produção:

- [ ] Configurar variáveis de ambiente
- [ ] Validar credenciais do Supabase
- [ ] Testar conexão MQTT
- [ ] Configurar permissões de usuário
- [ ] Validar fluxos de autenticação
- [ ] Testar funcionalidades críticas
- [ ] Documentar configurações específicas

## ✒️ Autores

* **thsethub** - *Trabalho Inicial* e *Documentação* - [Thiago Augusto](https://github.com/thsethub)

Veja também a lista de [contribuidores](https://github.com/thsethub/OPDEE/contributors) que participaram deste projeto.

## 📄 Licença

Este projeto está sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

A licença MIT permite:
- ✅ Uso comercial
- ✅ Modificação
- ✅ Distribuição
- ✅ Uso privado

## 🙏 Agradecimentos

- **Universidade Federal de Pernambuco (UFPE)**
- **Departamento de Engenharia Elétrica**
- **Equipe de desenvolvimento**
- **Comunidade de contribuidores**

---

<div align="center">

**OPDEE** - Sistema de Controle de Acesso para Laboratórios

⌨️ Desenvolvido com ❤️ por [Thiago Augusto](https://github.com/thsethub)

[🔝 Voltar ao topo](#-opdee---sistema-de-controle-de-acesso)

</div>
