# Використовуйте базовий образ з потрібною версією Node.js
FROM node:16

# Встановіть робочу директорію
WORKDIR /usr/src/app

# Копіюйте package.json та package-lock.json
COPY package*.json ./

# Встановіть залежності
RUN npm install

# Копіюйте решту файлів
COPY . .

# Відкрийте порт, використовуючи змінну середовища PORT

EXPOSE $PORT

# Запустіть додаток
CMD ["npm", "start"]
