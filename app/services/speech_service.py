from app.utils.db import connection, close

def get_speech(device_id: str):
    db = connection()
    cur = db.cursor(dictionary=True)

    cur.execute("SELECT rate, pitch FROM speeches WHERE device_id = %s", (device_id,))
    row = cur.fetchone()

    if row is None:
        result = {"rate": 1.0, "pitch": 1.0}
    else:
        result = {
            "rate": row.get("rate") if row.get("rate") is not None else 1.0,
            "pitch": row.get("pitch") if row.get("pitch") is not None else 1.0,
        }

    close(cur, db)
    return result


def save_speech(device_id: str, rate: float, pitch: float):
    db = connection()
    cur = db.cursor()

    sql = """
    INSERT INTO speeches (device_id, rate, pitch)
    VALUES (%s, %s, %s)
    ON DUPLICATE KEY UPDATE rate = %s, pitch = %s
    """
    cur.execute(sql, (device_id, rate, pitch, rate, pitch))
    db.commit()

    close(cur, db)
    return {"message": "음성 설정이 성공적으로 저장되었습니다."}
