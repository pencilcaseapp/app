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

Start a local Postgres database with Docker Compose:

```bash
npm run docker:up
```

The Docker containers run in the background, regardless of the development server. 
You can stop the containers with `npm run docker:down`

### Environment

Create a `.env` file to set some environment variables. To get started, just copy the example file.

```bash
cp .env.example .env
```

### Development

Start the development server:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## License

Just MIT. See [license](LICENSE.md).