import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'

// 注意:本项目使用大量命令式副作用(定时器 + 异步大模型调用),因此不使用 StrictMode,
// 以避免开发环境下 Effects 被双调导致重复构建 / 重复请求。
ReactDOM.createRoot(document.getElementById('root')!).render(<App />)