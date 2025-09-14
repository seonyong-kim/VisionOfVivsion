from app.utils.db import connection, close

def register_device(device_id: str) -> dict:
    try:
        db_connection = connection()
        cursor = db_connection.cursor()

        # device_id 중복 확인
        cursor.execute("SELECT device_id FROM users WHERE device_id = %s", (device_id,))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO users(device_id) VALUES(%s)", (device_id,))
            db_connection.commit()

        # 튜토리얼 완료 처리
        cursor.execute("UPDATE users SET tutorial_done = TRUE WHERE device_id = %s", (device_id,))
        db_connection.commit()

        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        try:
            close(cursor, db_connection)
        except:
            pass
