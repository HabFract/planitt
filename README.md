# Planitt - your visual, local-first, peer-to-peer encrypted behavioural planner!

![planitt-transp](https://github.com/user-attachments/assets/c1807428-6743-4986-9e36-e8dafe4e090c)

Planitt is an innovative habit tracking application that empowers users to create and manage goals and habits through a fractal structure. Built on Holochain, it ensures complete control over privacy and data sovereignty.

## 🌟 Features
- **Fractal Structure**: Create a never-ending fractal of goals and habits.
- **Dynamic Visualizations**: Visualize progress with intuitive data visualizations.
- **Data Sovereignty**: Maintain full control over your data with Holochain's encryption.
- **Peer-to-Peer Sharing (ON ROADMAP)**: Share and trade visualizations within a secure network.
- **Private Channels (ON ROADMAP)**: Collaborate with others for accountability and mentorship.

Join us in the journey of self-improvement and achievement with Planitt, your companion for consistent progress.

## 🚀 Getting Started

### Prerequisites

- **Nix**: Install using the command:
  ```bash
  bash <(curl https://holochain.github.io/holochain/setup.sh)
  ```
- **pnpm**: Ensure `pnpm` is installed globally.

### Development Environment Setup

1. **Enter Development Shell**:
   ```bash
   nix develop
   ```

2. **Install Dependencies**:
   ```bash
   pnpm i
   ```

3. **Build Design System**:
   ```bash
   pnpm run --dir design-system build
   ```

4. **Configure Environment**:
   - Rename `example.env` to `.env` and adjust port numbers as needed.

5. **Start Development Server**:
   ```bash
   pnpm run dev
   ```

6. **Access Application**:
   - Open your browser at [http://localhost:8888](http://localhost:8888) (refresh if necessary).

### GraphQL Intellisense

1. **Install VSCode Extension**: 'GraphQL for VSCode'
2. **Install Watchman**: [Watchman Installation Guide](https://facebook.github.io/watchman/docs/install)

Check the 'GraphQL - monorepo' output tab in your console for errors.

## 🧪 Running Tests

- In a Nix shell, execute:
  ```bash
  pnpm test
  ```

## 🏭 Production Setup

1. **Open Nix Shell**:
   ```bash
   nix develop
   ```

2. **Build Frontend**:
   ```bash
   pnpm run build:frontend
   ```

3. **Start Application**:
   ```bash
   pnpm start
   ```

4. **Build for Android**
  ```
  npx tauri android build
  ```

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🔗 Links

- [Website](https://plannit.io)
- [Video Demo]: (https://streamable.com/pu04hz?src=player-page-share)
