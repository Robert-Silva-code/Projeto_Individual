# Sistema de Gerenciamento de Pousada

O projeto foi desenvolvido usando **Node.js** com **Express**, **Prisma ORM** e **SQLite**, **EJS** para visualização do Frontend, **JWT** e **Bcrypt**

___

## Requisitos
* Node.js
* npm

___


## Como Executar

### 1. Instalar as dependências

```bash
npm install
```

### 2. Crie um arquivo .env usando o .env.example de base 


### 3. Execute as migrações do Prisma

```bash
npx prisma migrate dev --name init
```

### 4. Iniciar o servidor

```bash
npm run dev
```

### 5. Acesse a aplicação em http://localhost:3000


___

## Funcionalidades

* Cadastro de novos usuários, login seguro com criptografia de senha (Bcrypt) e sessões via JWT em Cookies.
* Quartos: Listagem, cadastro, edição e exclusão de quartos
* Reservas: Criação de reservas vinculadas ao usuário logado e ao quarto escolhido, com cálculo automático de diárias e valores
* Usuário: Área de configuração para atualizar dados ou excluir conta 