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

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## License

Just MIT. See [license](LICENSE.md).