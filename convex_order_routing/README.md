# Tối Ưu Định Tuyến: Convex Order Splitting & PRIME bằng Sui PTBs

Thư mục này chứa bản triển khai kỹ thuật (Proof of Concept) cho thuật toán định tuyến tối ưu (Convex Routing) dựa trên cấu trúc lồi của Angeris & Boyd (PRIME), tận dụng các **Khối giao dịch lập trình (PTBs - Programmable Transaction Blocks)** trên Sui Blockchain.

## Ưu điểm của Sui so với EVM (Mạng Lưới Phổ Thông)

| Tiêu Chí                        | EVM / Order-book                                                                        | Sui Blockchain                                                                                       |
| ---------------------------------| -----------------------------------------------------------------------------------------| ------------------------------------------------------------------------------------------------------|
| **Tách lệnh (Order Splitting)** | Tốn kém gas theo cấp số nhân khi tách qua nhiều pool CFMM. Cản trở bởi tốc độ 12s/khối. | PTB cho phép chẻ lệnh qua hàng chục DEX trong **cùng 1 giao dịch nguyên tử (atomic transaction)**.   |
| **Thực thi**                    | Tuần tự (Sequential). Gây nghẽn cổ chai.                                                | Song song (Parallel Execution) nhờ cơ chế kiểm tra xung đột tĩnh cô lập (static conflict detection). |
| **Chi phí**                     | Gộp chung gas (storage + compute), cực kỳ đắt đỏ khi thao tác với nhiều smart contract. | Tách biệt chi phí (compute và storage). Compute gas siêu rẻ, hoàn trả gas lưu trữ khi xóa đối tượng. |

## Kiến trúc Hệ Thống

Hệ thống được chia thành 2 phần chính:

1. **Off-chain Convex Optimizer (TypeScript)**:
   - File: `scripts/routing_engine.ts`
   - Giải bài toán tối ưu lồi để tìm ra tỷ lệ tách lệnh tối ưu nhất qua các bể thanh khoản (Ví dụ: 30% qua DeepBook, 50% qua Cetus, 20% qua Turbos).
   - Tự động xây dựng một PTB (Programmable Transaction Block) từ kết quả tối ưu.

2. **On-chain Unified Router / Execution (Sui Move)**:
   - Thư mục: `contracts/`
   - Nhận PTB, thực thi chẻ lệnh (`splitCoins`), gọi hàm `swap` của từng DEX một cách nguyên tử.
   - Hàm `assert_minimum_balance` gom kết quả (mergeCoins) và kiểm tra mức trượt giá (slippage) toàn cục. Nếu tổng output `< minimum_expected`, toàn bộ PTB sẽ bị abort (hoàn lại trạng thái ban đầu), bảo vệ an toàn cho tài sản.

## Hướng dẫn Triển Khai Thực Tiễn (Actionable Implementations)

### Cấu trúc mã

- `contracts/sources/router.move`: Giao diện chung để gọi các DEX và kiểm tra slippage cuối cùng.
- `scripts/routing_engine.ts`: Script TypeScript kết nối trực tiếp với **Sui Testnet RPC**. Nó khôi phục địa chỉ từ Mnemonic và xây dựng giao dịch Sui PTB dựa trên thuật toán chia lượng (Order Splitting).

### Workflow Chi Tiết (Luồng Xử Lý)

Hệ thống hoạt động theo luồng (workflow) nguyên tử như sau:
1. **Khởi tạo Client & Xác thực**: `routing_engine.ts` kết nối tới `fullnode.testnet.sui.io` và khôi phục Keypair của người dùng (từ Mnemonic).
2. **Khởi tạo PTB**: Tạo một `Transaction()` block trống.
3. **Phân mảnh tài sản (Split)**: Sử dụng lệnh `tx.splitCoins` để chia Coin đầu vào thành các phần nhỏ với tỷ lệ tương ứng từ thuật toán (VD: 30%, 50%, 20%).
4. **Định tuyến song song (Route)**: Gửi song song các phần Coin vừa cắt vào các Smart Contract của từng DEX tương ứng (`tx.moveCall`). Quá trình này được Sui thực thi song song hoàn toàn.
5. **Gộp tài sản (Merge)**: Gom tất cả các Output Coin thu được từ các DEX thành một Coin duy nhất (`tx.mergeCoins`).
6. **Kiểm duyệt trượt giá (Slippage Check)**: Gọi hàm `assert_minimum_balance` trong contract `router.move` để kiểm tra tổng số lượng thu được. Nếu con số này nhỏ hơn mức tối thiểu (Min Global Output), giao dịch tự động **hủy (Abort)**, hoàn trả lại tiền như chưa có chuyện gì xảy ra.

### Quy trình chạy hệ thống

1. **Cài đặt Sui CLI** (nếu chưa có):
   ```bash
   curl -sSfL https://raw.githubusercontent.com/MystenLabs/suiup/main/install.sh | sh
   suiup install sui@testnet
   suiup switch sui@testnet
   ```

2. **Build Smart Contract Router**:
   ```bash
   cd contracts
   sui move build
   ```

3. **Chạy Routing Engine (TypeScript SDK)**:
   - Yêu cầu môi trường: **Node.js v18 trở lên** (Do `@mysten/sui` sử dụng các API mạng hiện đại).
   - Cài đặt dependency: 
   ```bash
   npm install
   ```
   - Khởi chạy quá trình xây dựng giao dịch nguyên tử trên mạng Testnet:
   ```bash
   npx ts-node scripts/routing_engine.ts
   ```

### Lợi ích nhận được

- **Giảm Trượt Giá**: Khả năng phân bổ Convex giúp giữ trượt giá (slippage) cực thấp (kỳ vọng `< 8.42 bps`).
- **An Toàn Nguyên Tử**: Toàn bộ quá trình swap ở hàng chục DEX và việc kiểm tra diễn ra ở trong 1 transaction duy nhất. Không có rủi ro bị "mắc kẹt" giữa chừng.
