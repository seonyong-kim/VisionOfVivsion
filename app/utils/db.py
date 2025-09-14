import mysql.connector
import boto3
import os

def load_ssm_to_env(param_map, region="ap-northeast-2"):
    ssm = boto3.client('ssm', region_name=region)
    for env_name, ssm_name in param_map.items():
        response = ssm.get_parameter(Name=ssm_name, WithDecryption=True)
        os.environ[env_name] = response['Parameter']['Value']

# SSM 파라미터 → 환경변수
PARAMS = {
    "authHost": "/db/host",
    "authUser": "/db/user",
    "authPassword": "/db/password",
    "authDatabase": "/db/database",
}
load_ssm_to_env(PARAMS)

authHost = os.getenv("authHost")
authUser = os.getenv("authUser")
authPassword = os.getenv("authPassword")
authDatabase = os.getenv("authDatabase")

def connection():
    return mysql.connector.connect(
        host=authHost,
        user=authUser,
        password=authPassword,
        database=authDatabase
    )

def close(cursor, db_connection):
    cursor.close()
    db_connection.close()
