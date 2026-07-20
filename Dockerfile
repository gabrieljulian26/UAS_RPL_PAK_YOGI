FROM node:18-alpine

WORKDIR /app

# Salin package.json dan pasang dependensi
COPY package.json ./
RUN npm install

# Salin semua berkas proyek ke container
COPY . .

# Ekspos port 3000 untuk diakses dari luar
EXPOSE 3000

# Jalankan server Express
CMD ["npm", "start"]
