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

Start a local Postgres database with Docker:

```bash
npm run docker:up
```

The Docker containers run in the background, regardless of the development server. 
You can stop the containers with `npm run docker:down`

### Server

Start the development server:

```bash
npm run dev
```

Your app will be available at `http://localhost:5173`.

## License

Just MIT. See [license](LICENSE.md).