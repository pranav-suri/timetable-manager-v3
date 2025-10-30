# Running Instructions

## Installation Steps

1. Clone the repository (if not already done)

2. Install dependencies:

```bash
npm install
```

## Skip Steps 3 and 4 if you are running this from zip file

## We've already done these for you

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Configure the necessary environment variables

4. Set up the database:

```bash
npx prisma generate
npx prisma db push
```

## Running the Project

Start the development server:

```bash
npm run dev
```

The application will be available at: **http://localhost:8080**

## Accessing the Application

1. Navigate to: **http://localhost:8080/tt**

2. Log in using the sample credentials displayed on the login page

3. After logging in, check the **top right corner** to see your user is part of default organisation and can only view its data

## Troubleshooting

- If port 8080 is already in use, check your [`vite.config.ts`](vite.config.ts) to modify the port
- Ensure your database is properly configured and accessible
- Make sure all environment variables in `.env` are correctly set
