# Use Node.js latest LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the frontend bundle
RUN npm run build

# Expose the backend port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
