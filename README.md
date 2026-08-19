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

### Services

Start the local Postgres databases and Redis with Docker:

```bash
npm run docker:up
```

The Docker containers run in the background, regardless of the development server. 
You can stop the containers with `npm run docker:down`

Redis is what lets several live servers share a document, so it only matters
once the app runs on more than one instance. See [scaling](docs/scaling.md).

### Server

Start the development server:

```bash
npm run dev
```

Your app will be available at `http://localhost:3000`.

## License

Just MIT. See [license](LICENSE.md).