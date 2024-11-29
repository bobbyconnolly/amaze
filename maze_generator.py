import random


def generate_maze(width, height):
    """
    Tạo mê cung sử dụng thuật toán đệ quy quay lui.
    0 = đường đi, 1 = tường
    """
    # Khởi tạo mê cung với toàn tường
    maze = [[1 for x in range(width)] for y in range(height)]

    def carve_path(x, y):
        maze[y][x] = 0  # Đánh dấu ô hiện tại là đường đi

        # Định nghĩa 4 hướng có thể đi: phải, xuống, trái, lên
        directions = [(2, 0), (0, 2), (-2, 0), (0, -2)]
        random.shuffle(directions)  # Xáo trộn các hướng để tạo ngẫu nhiên

        # Thử từng hướng
        for dx, dy in directions:
            new_x, new_y = x + dx, y + dy

            # Kiểm tra xem có thể đi theo hướng này không
            if (0 <= new_x < width and 0 <= new_y < height
                    and maze[new_y][new_x] == 1):  # Nếu vẫn là tường

                # Phá tường giữa ô hiện tại và ô mới
                maze[y + dy // 2][x + dx // 2] = 0
                carve_path(new_x, new_y)

    # Bắt đầu từ ô (1,1) để tạo đường viền
    carve_path(1, 1)

    # Đảm bảo lối vào và ra thông thoáng
    maze[1][1] = 0  # Điểm bắt đầu
    maze[1][2] = 0  # Đường vào
    maze[height - 2][width - 2] = 0  # Điểm đích
    maze[height - 2][width - 3] = 0  # Đường ra

    return maze