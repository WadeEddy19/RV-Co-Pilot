import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

def get_conn():
    db_url = os.environ["DATABASE_URL"]
    return psycopg.connect(db_url)
