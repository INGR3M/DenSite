from sshtunnel import SSHTunnelForwarder
import psycopg2
from getpass import getpass
from prettytable import PrettyTable

# Конфигурация
ssh_host = "u_h_name"
ssh_user = "root"
db_host = "localhost"
db_name = "db_nam"
db_user = "postgres"
db_port = 5432

# Получение паролей
ssh_password = getpass("🔐 Пароль от SSH: ")
db_password = getpass("🔐 Пароль от БД: ")

# Установка SSH-туннеля
server = SSHTunnelForwarder(
    (ssh_host, 22),
    ssh_username=ssh_user,
    ssh_password=ssh_password,
    remote_bind_address=(db_host, db_port),
    local_bind_address=('127.0.0.1', 5433)
)

server.start()

# Подключение к базе данных
conn = psycopg2.connect(
    database=db_name,
    user=db_user,
    password=db_password,
    host='127.0.0.1',
    port=server.local_bind_port
)
cur = conn.cursor()

def list_tables():
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    """)
    tables = [row[0] for row in cur.fetchall()]
    print("\n📋 Доступные таблицы:")
    for i, tbl in enumerate(tables):
        print(f"{i + 1}. {tbl}")
    return tables

def get_table_columns(table):
    cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = %s", (table,))
    return [row[0] for row in cur.fetchall()]

def display_table(table):
    cur.execute(f"SELECT * FROM {table}")
    rows = cur.fetchall()
    cols = [desc[0] for desc in cur.description]
    t = PrettyTable()
    t.field_names = cols
    for row in rows:
        t.add_row(row)
    print(t)

def insert_row(table, columns):
    values = []
    print("\n➕ Введите значения для новой записи:")
    for col in columns:
        val = input(f"{col}: ")
        values.append(val if val else None)
    placeholders = ', '.join(['%s'] * len(columns))
    query = f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders})"
    cur.execute(query, values)
    conn.commit()
    print("✅ Запись добавлена.")

def update_row(table, columns):
    print("\n✏️ Укажите условия (например: id = 1):")
    condition = input("WHERE: ")
    print("\nВведите новые значения (оставьте пустым, если не менять):")
    set_clauses = []
    values = []
    for col in columns:
        val = input(f"{col}: ")
        if val:
            set_clauses.append(f"{col} = %s")
            values.append(val)
    if not set_clauses:
        print("❌ Ничего не указано.")
        return
    query = f"UPDATE {table} SET {', '.join(set_clauses)} WHERE {condition}"
    cur.execute(query, values)
    conn.commit()
    print("✅ Запись обновлена.")

def delete_row(table):
    condition = input("\n🗑️ Введите условие удаления (например: id = 1): ")
    query = f"DELETE FROM {table} WHERE {condition}"
    cur.execute(query)
    conn.commit()
    print("✅ Запись удалена.")

def main():
    try:
        tables = list_tables()
        index = int(input("\nВыберите таблицу (номер): ")) - 1
        table = tables[index]
        columns = get_table_columns(table)
        print(f"\nВы выбрали таблицу: {table}")
        display_table(table)

        while True:
            print("\nЧто вы хотите сделать?")
            print("1. Добавить запись")
            print("2. Обновить запись")
            print("3. Удалить запись")
            print("4. Показать таблицу")
            print("5. Выйти")
            choice = input("Ваш выбор: ")

            if choice == "1":
                insert_row(table, columns)
            elif choice == "2":
                update_row(table, columns)
            elif choice == "3":
                delete_row(table)
            elif choice == "4":
                display_table(table)
            elif choice == "5":
                break
            else:
                print("❌ Неверный выбор.")
    finally:
        cur.close()
        conn.close()
        server.stop()
        print("🔒 Соединение закрыто.")

if __name__ == "__main__":
    main()
