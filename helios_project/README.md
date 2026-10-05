# HELIOS – Online Watch Marketplace

This version connects the Flask website's product catalogue to the PostgreSQL database.

## 1. Install dependencies
```
pip install -r requirements.txt
```

## 2. Database
Create/use the PostgreSQL database named `helios_db` and run the Helios table + sample-data SQL created for the project.

## 3. Set the PostgreSQL password
In PowerShell, before starting Flask, run:

```powershell
$env:HELIOS_DB_PASSWORD="YOUR_POSTGRES_PASSWORD"
```

If your PostgreSQL username/database/port are different, you can also set:

```powershell
$env:HELIOS_DB_USER="postgres"
$env:HELIOS_DB_NAME="helios_db"
$env:HELIOS_DB_HOST="localhost"
$env:HELIOS_DB_PORT="5432"
```

## 4. Start the website
```
python app.py
```

Open `http://127.0.0.1:5000`.

## What is database-connected now?
- Product list
- Product details
- Brand and seller information
- Stock
- Watch specifications
- Product categories

The current cart, favourites, demo login and demo orders still use browser localStorage. We will move those into PostgreSQL in the next implementation stages.
