# 恐怖世界接入

请将完整、自包含的单文件游戏命名为 `游戏.html` 放在此目录。告知缝合方表示天亮结束的 DOM 元素 ID：该元素在结束前应处于 hidden、display:none 或 visibility:hidden 状态，结束时变为可见。将 ID 填入 `融合框架/config.json` 的 `horror_signal_id`。不要使用开始时就可见的元素。

原版文件不会被构建脚本修改。带外部依赖的 HTML 需要先自行打包为单文件；脚本注入的音频解锁只能在玩家真实操作时尝试恢复 AudioContext，最终效果须在目标浏览器实测。
