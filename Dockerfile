FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies including the NestJS CLI
RUN npm install
RUN npm install -g @nestjs/cli

# Copy application source
COPY . .

# Build the application
RUN npm run build

# Expose the application port
EXPOSE 3000

# Run the application
CMD ["npm", "run", "start"]