from app.utils.db import connection, close

def get_favorites(device_id: str):
    db = connection()
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT * FROM favorites WHERE device_id = %s", (device_id,))
    data = cur.fetchall()
    close(cur, db)
    return data

def create_favorite(device_id: str, name: str, address: str):
    db = connection()
    cur = db.cursor()
    insert_query = """
        INSERT INTO favorites(address, name, device_id)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE address = VALUES(address), name = VALUES(name)
    """
    cur.execute(insert_query, (address, name, device_id))
    db.commit()

    cur = db.cursor(dictionary=True)
    cur.execute("SELECT * FROM favorites WHERE device_id = %s", (device_id,))
    output = cur.fetchall()
    close(cur, db)
    return output

def update_favorite(fav_id: int, device_id: str, name: str, address: str):
    db = connection()
    cur = db.cursor()
    query = "UPDATE favorites SET address=%s, name=%s WHERE favorite_id=%s AND device_id=%s"
    cur.execute(query, (address, name, fav_id, device_id))
    db.commit()

    cur = db.cursor(dictionary=True)
    cur.execute("SELECT * FROM favorites WHERE device_id=%s", (device_id,))
    output = cur.fetchall()
    close(cur, db)
    return output

def delete_favorite(fav_id: int, device_id: str):
    db = connection()
    cur = db.cursor()
    query = "DELETE FROM favorites WHERE favorite_id=%s AND device_id=%s"
    cur.execute(query, (fav_id, device_id))
    db.commit()

    # 삭제 확인
    cur.execute("SELECT * FROM favorites WHERE favorite_id=%s AND device_id=%s", (fav_id, device_id))
    result = cur.fetchall()
    close(cur, db)
    return result
