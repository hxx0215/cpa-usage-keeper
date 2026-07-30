{
  description = "CPA Usage Keeper development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          default = pkgs.mkShell {
            packages = with pkgs; [
              # Backend (CGO required by mattn/go-sqlite3)
              go
              gcc
              gnumake
              pkg-config

              # Frontend
              nodejs_22

              # Tooling
              git
              cacert
            ];

            CGO_ENABLED = "1";

            shellHook = ''
              # Keep module/build caches inside the project so they survive
              # shell reloads and stay writable without polluting $HOME.
              export GOPATH="$PWD/.go"
              export GOCACHE="$PWD/.go/cache"
              export GOMODCACHE="$PWD/.go/pkg/mod"
              export npm_config_cache="$PWD/.npm-cache"
              mkdir -p .go/cache .go/pkg/mod .npm-cache
              export PATH="$PWD/.go/bin:$PATH"

              echo "cpa-usage-keeper dev shell"
              echo "  go:   $(go version)"
              echo "  node: $(node --version)  npm: $(npm --version)"
              echo ""
              echo "Quick start:"
              echo "  1. cp .env.example .env   # set CPA_BASE_URL + CPA_MANAGEMENT_KEY"
              echo "  2. go run ./cmd/server/main.go"
              echo "  3. npm --prefix ./web ci && npm --prefix ./web run dev -- --host 127.0.0.1"
              echo "  make verify               # full backend + frontend checks"
            '';
          };
        }
      );

      formatter = forAllSystems (
        system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        pkgs.nixfmt-rfc-style
      );
    };
}
