# AGENTS.md

## 仓库定位

本仓库是 [Willxup/cpa-usage-keeper](https://github.com/Willxup/cpa-usage-keeper) 的个人 fork。
它的核心目的，是保留 CPA Usage Keeper 的主体功能，同时**移除社区/远程排名功能**：

- 不要重新引入 `internal/ranking`、排名 API/路由、排名页面、排名翻译、排名截图或相关 wiring。
- 上游如果在合并时重新带回排名代码，解决冲突时必须保留本 fork 的“去掉排名”设计。
- 只跟踪上游的正式 `main` 分支；不要把 `upstream/worktree/ranking-local-ui-demo` 等实验性排名分支合并进来，除非 Master 明确要求。

## Remote 与分支

- `origin`：本 fork，`git@github.com:hxx0215/cpa-usage-keeper.git`
- `upstream`：原始仓库，`git@github.com:Willxup/cpa-usage-keeper.git`
- 日常工作分支：`main`
- 代码和 tag 只推送到 `origin`，不要向 `upstream` 推送。

## 固定的上游同步流程

每次需要跟进上游时，都按下面的顺序执行，不能跳过“合并”或“验证”：

### 1. 同步前检查

1. 确认当前在 `main`，并检查工作区是否干净：

   ```bash
   git branch --show-current
   git status --short
   ```

2. 有未提交改动时先停下来并报告，不要丢弃、覆盖或自动 stash Master 的改动。
3. 刷新上游分支和 tag：

   ```bash
   git fetch --prune --tags upstream
   ```

4. 只以 `upstream/main` 作为代码同步来源。上游的 worktree/实验分支只用于查看，不作为默认合并目标。

### 2. 合并上游主线

在 `main` 上合并最新的上游主线，保留 fork 自己的提交历史：

```bash
git merge --no-edit upstream/main
```

如果发生冲突：

- 优先保留本 fork 删除排名的结果；
- 检查 API 路由、应用 wiring、后端 `internal/ranking`、前端 `web/src/features/ranking`、翻译和截图是否被上游重新带回；
- 解决完成后运行 `git status`，确认没有未处理的冲突，再创建合并提交；
- 无法确定时停下来询问，不要用 `git reset --hard`、`git checkout --` 或强制覆盖来“解决”冲突。

合并后至少运行后端测试；依赖齐全时运行完整校验：

```bash
go test ./cmd/... ./internal/...
make verify
```

测试失败、排名代码意外复活或工作区不干净时，停止流程，不要继续 push/tag。

### 3. 推送 fork 的主线

确认合并成功且测试通过后，把当前 `main` 推到 fork：

```bash
git push origin main
```

不要把这一步改成推送 `upstream`，也不要对 `main` 使用 force push。

### 4. 使用上游最新正式 tag 标记当前 fork

“最后一个上游 tag”指上游正式发布的 `v*` tag，不是 worktree 分支上的临时提交。先从远端计算最新版本号：

```bash
latest_tag=$(git ls-remote --tags --refs upstream 'refs/tags/v*' \
  | awk -F/ '{print $3}' \
  | sort -V \
  | tail -n 1)
test -n "$latest_tag"
printf 'latest upstream tag: %s\n' "$latest_tag"
```

将这个**同名 tag 指向本次合并后的当前 `HEAD`**，而不是重新指向上游原来的 tag 提交。上游 tag 被 fetch 到本地后，可能已经占用了同名本地 tag；只有确认 `origin` 尚不存在该 tag 时，才允许移动本地 tag：

```bash
remote_tag=$(git ls-remote --tags --refs origin "refs/tags/$latest_tag" | awk '{print $1}')
if [ -n "$remote_tag" ]; then
  echo "origin already has $latest_tag; verify it before doing anything else"
  exit 1
fi

git tag -f "$latest_tag" HEAD
git push origin "refs/tags/$latest_tag"
```

如果 `origin` 已经存在同名 tag：

- 指向当前 `HEAD` 时，不要重复操作；
- 指向其他提交时，停止并报告，绝不擅自 force-push 或改写远端 tag。

打 tag 前后都应核对：

```bash
git rev-parse --short HEAD
git rev-parse --short "$latest_tag"
git ls-remote --tags origin "refs/tags/$latest_tag"
git status --short --branch
```

tag 会触发 fork 的发布工作流，因此必须在合并、测试和 `main` push 都成功后才执行。

## 安全边界

- 不执行 `git reset --hard`、批量删除文件或其他会丢失用户改动的操作，除非 Master 明确授权。
- 不 force-push `main` 或远端 tag。
- 不把排名实验分支合并进本 fork。
- 上游合并冲突、测试失败、远端 tag 冲突或 remote 配置异常时，停在当前步骤并报告具体原因。
