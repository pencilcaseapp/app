# pencil case app

## Local Development

### Prerequisites

- [Docker Desktop](https://docs.docker.com/desktop/)
- [Node.js](https://nodejs.org/en/download)

### Installation

Install the dependencies:

```bash
npm install
```

### Database

Start and migrate a local Postgres database:

```bash
# Spin up db with Docker Compose
npm run docker:up

# Run SQL migrations with Drizzle
npx drizzle-kit migrate
```

The Docker containers run in the background, regardless of the development server. 
You can stop the containers with `npm run docker:down`

### Development

Start the development server:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## License

Just MIT. See [license](LICENSE.md).