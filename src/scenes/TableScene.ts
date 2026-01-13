import Phaser from "phaser";

type TileLocation = "rack" | "table";

type Tile = {
  container: Phaser.GameObjects.Container;
  image: Phaser.GameObjects.Image;
  text: Phaser.GameObjects.Text;
  location: TileLocation;
  lastValid: Phaser.Math.Vector2;
};

export default class TableScene extends Phaser.Scene {
  private background?: Phaser.GameObjects.Image;
  private tableOverlay?: Phaser.GameObjects.Graphics;
  private rackOverlay?: Phaser.GameObjects.Graphics;
  private logoText?: Phaser.GameObjects.Text;
  private rackSlots: Phaser.Math.Vector2[] = [];
  private rackTiles: Tile[] = [];
  private tableTiles: Tile[] = [];
  private rackRect = new Phaser.Geom.Rectangle();
  private tableRect = new Phaser.Geom.Rectangle();
  private dropRect = new Phaser.Geom.Rectangle();
  private tileScale = 1;
  private tileSize = { width: 220, height: 100 };

  constructor() {
    super("TableScene");
  }

  create(): void {
    this.createTileBaseTexture();
    this.createBackground();
    this.createOverlays();
    this.createLogo();
    this.createTiles();

    this.input.on("dragstart", (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container) => {
      const tile = this.findTile(gameObject);
      if (!tile) {
        return;
      }
      tile.container.setScale(this.tileScale * 1.06);
      tile.container.setDepth(50);
      tile.lastValid = new Phaser.Math.Vector2(tile.container.x, tile.container.y);
    });

    this.input.on(
      "drag",
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container, dragX: number, dragY: number) => {
        gameObject.setPosition(dragX, dragY);
      }
    );

    this.input.on("dragend", (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container) => {
      const tile = this.findTile(gameObject);
      if (!tile) {
        return;
      }
      tile.container.setScale(this.tileScale);

      if (Phaser.Geom.Rectangle.Contains(this.tableRect, pointer.x, pointer.y)) {
        this.moveTileToTable(tile, pointer.x, pointer.y);
      } else if (Phaser.Geom.Rectangle.Contains(this.rackRect, pointer.x, pointer.y)) {
        this.moveTileToRack(tile, pointer.x);
      } else {
        tile.container.setPosition(tile.lastValid.x, tile.lastValid.y);
      }
    });

    this.scale.on("resize", this.handleResize, this);
    this.layoutScene();
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    this.layoutScene(width, height);
  }

  private layoutScene(width = this.scale.width, height = this.scale.height): void {
    this.updateBackground(width, height);
    this.updateLayoutRects(width, height);
    this.updateOverlays(width, height);
    this.updateLogo();
    this.updateTileScale();
    this.updateRackSlots();
    this.layoutRackTiles(false);
    this.layoutTableTiles();
  }

  private updateLayoutRects(width: number, height: number): void {
    const tableHeight = height * 0.5;
    const tableWidth = width * 0.84;
    const tableX = (width - tableWidth) / 2;
    const tableY = height * 0.16;

    this.tableRect.setTo(tableX, tableY, tableWidth, tableHeight);

    const rackHeight = height * 0.2;
    const rackY = height - rackHeight * 0.85;
    this.rackRect.setTo(width * 0.05, rackY - rackHeight * 0.3, width * 0.9, rackHeight);

    const dropWidth = tableWidth * 0.36;
    const dropHeight = tableHeight * 0.32;
    const dropX = width / 2 - dropWidth / 2;
    const dropY = tableY + tableHeight * 0.12;
    this.dropRect.setTo(dropX, dropY, dropWidth, dropHeight);
  }

  private updateTileScale(): void {
    const rackWidth = this.rackRect.width;
    let tileHeight = Phaser.Math.Clamp(this.scale.height * 0.085, 44, 84);
    let tileWidth = tileHeight * 2.2;
    const totalWidth = tileWidth * 14;

    if (totalWidth > rackWidth) {
      tileWidth = rackWidth / 14;
      tileHeight = tileWidth / 2.2;
    }

    this.tileScale = tileHeight / this.tileSize.height;
  }

  private createTileBaseTexture(): void {
    if (this.textures.exists("tile-base")) {
      return;
    }

    const width = this.tileSize.width;
    const height = this.tileSize.height;
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });

    graphics.fillStyle(0x000000, 0.25);
    graphics.fillRoundedRect(6, 10, width - 12, height - 12, 16);

    graphics.fillStyle(0xf6f1e5, 1);
    graphics.fillRoundedRect(0, 0, width, height, 18);

    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillRoundedRect(6, 6, width - 12, height - 16, 14);

    graphics.lineStyle(2, 0xffffff, 0.9);
    graphics.strokeRoundedRect(2, 2, width - 4, height - 4, 16);

    graphics.lineStyle(2, 0xc7b9a5, 0.8);
    graphics.strokeRoundedRect(5, 5, width - 10, height - 10, 14);

    graphics.generateTexture("tile-base", width, height);
    graphics.destroy();
  }

  private createTiles(): void {
    const colors = ["#c62828", "#1a1a1a", "#1565c0", "#2e7d32"];
    for (let i = 0; i < 14; i += 1) {
      const number = (i % 13) + 1;
      const color = colors[i % colors.length];
      const image = this.add.image(0, 0, "tile-base");
      const text = this.add.text(0, 0, `${number}`, {
        fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif",
        fontSize: "48px",
        color,
        fontStyle: "700",
        stroke: "#f4efe6",
        strokeThickness: 6
      });
      text.setOrigin(0.5);

      const container = this.add.container(0, 0, [image, text]);
      container.setSize(this.tileSize.width, this.tileSize.height);
      container.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, this.tileSize.width, this.tileSize.height),
        Phaser.Geom.Rectangle.Contains
      );
      this.input.setDraggable(container);

      const tile: Tile = {
        container,
        image,
        text,
        location: "rack",
        lastValid: new Phaser.Math.Vector2(0, 0)
      };
      this.rackTiles.push(tile);
    }

    this.layoutScene();
  }

  private updateRackSlots(): void {
    const rackWidth = this.rackRect.width;
    const tileWidth = this.tileSize.width * this.tileScale;
    const gap = Math.max(4, (rackWidth - tileWidth * 14) / 13);
    const totalWidth = tileWidth * 14 + gap * 13;
    const startX = this.rackRect.x + (rackWidth - totalWidth) / 2 + tileWidth / 2;
    const centerY = this.rackRect.y + this.rackRect.height * 0.55;

    this.rackSlots = Array.from({ length: 14 }, (_value, index) => {
      return new Phaser.Math.Vector2(startX + index * (tileWidth + gap), centerY);
    });
  }

  private layoutRackTiles(animated = true): void {
    this.rackTiles.forEach((tile, index) => {
      const slot = this.rackSlots[index];
      tile.container.setScale(this.tileScale);
      if (!slot) {
        return;
      }
      if (animated) {
        this.tweens.add({
          targets: tile.container,
          x: slot.x,
          y: slot.y,
          duration: 150,
          ease: "Sine.Out"
        });
      } else {
        tile.container.setPosition(slot.x, slot.y);
      }
    });
  }

  private layoutTableTiles(): void {
    this.tableTiles.forEach((tile) => {
      tile.container.setScale(this.tileScale);
    });
  }

  private moveTileToTable(tile: Tile, x: number, y: number): void {
    if (tile.location === "rack") {
      this.rackTiles = this.rackTiles.filter((item) => item !== tile);
      this.layoutRackTiles();
    }
    tile.location = "table";
    if (!this.tableTiles.includes(tile)) {
      this.tableTiles.push(tile);
    }

    const clampedX = Phaser.Math.Clamp(x, this.tableRect.left + 30, this.tableRect.right - 30);
    const clampedY = Phaser.Math.Clamp(y, this.tableRect.top + 20, this.tableRect.bottom - 20);
    tile.container.setDepth(20 + this.tableTiles.length);
    tile.container.setPosition(clampedX, clampedY);
    tile.lastValid = new Phaser.Math.Vector2(tile.container.x, tile.container.y);
  }

  private moveTileToRack(tile: Tile, pointerX: number): void {
    if (tile.location === "table") {
      this.tableTiles = this.tableTiles.filter((item) => item !== tile);
    }

    tile.location = "rack";
    const index = this.getRackIndex(pointerX);

    this.rackTiles = this.rackTiles.filter((item) => item !== tile);
    this.rackTiles.splice(index, 0, tile);
    this.layoutRackTiles();

    const slot = this.rackSlots[index];
    if (slot) {
      tile.container.setPosition(slot.x, slot.y);
      tile.lastValid = new Phaser.Math.Vector2(slot.x, slot.y);
    }
  }

  private getRackIndex(pointerX: number): number {
    const distances = this.rackSlots.map((slot) => Math.abs(pointerX - slot.x));
    const minIndex = distances.indexOf(Math.min(...distances));
    return Phaser.Math.Clamp(minIndex, 0, this.rackSlots.length - 1);
  }

  private findTile(container: Phaser.GameObjects.Container): Tile | undefined {
    return [...this.rackTiles, ...this.tableTiles].find((tile) => tile.container === container);
  }

  private createBackground(): void {
    this.updateBackground(this.scale.width, this.scale.height);
    this.background = this.add.image(0, 0, "table-bg").setOrigin(0);
  }

  private updateBackground(width: number, height: number): void {
    const textureKey = "table-bg";
    const canvasTexture = this.textures.get(textureKey) as Phaser.Textures.CanvasTexture | undefined;
    const existingTexture = canvasTexture ?? this.textures.createCanvas(textureKey, width, height);
    existingTexture.resize(width, height);

    const ctx = existingTexture.getContext();
    ctx.clearRect(0, 0, width, height);

    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, "#3c2a1d");
    bgGradient.addColorStop(1, "#1b120c");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    const tableGradient = ctx.createLinearGradient(0, height * 0.2, 0, height * 0.7);
    tableGradient.addColorStop(0, "#1f6e4d");
    tableGradient.addColorStop(1, "#0f4f36");

    const tableX = width * 0.08;
    const tableY = height * 0.15;
    const tableWidth = width * 0.84;
    const tableHeight = height * 0.56;
    this.drawRoundedRect(ctx, tableX, tableY, tableWidth, tableHeight, 24, tableGradient);

    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 3000; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const alpha = Math.random() * 0.35;
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;

    const vignette = ctx.createRadialGradient(
      width * 0.5,
      height * 0.55,
      Math.min(width, height) * 0.2,
      width * 0.5,
      height * 0.55,
      Math.max(width, height) * 0.7
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    existingTexture.refresh();
    this.background?.setDisplaySize(width, height);
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fillStyle: string | CanvasGradient
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  private createOverlays(): void {
    this.tableOverlay = this.add.graphics();
    this.rackOverlay = this.add.graphics();
  }

  private updateOverlays(width: number, height: number): void {
    this.tableOverlay?.clear();
    this.tableOverlay?.fillStyle(0x000000, 0.18);
    this.tableOverlay?.fillRoundedRect(this.dropRect.x, this.dropRect.y, this.dropRect.width, this.dropRect.height, 16);
    this.tableOverlay?.lineStyle(2, 0x99c6b0, 0.6);
    this.tableOverlay?.strokeRoundedRect(this.dropRect.x, this.dropRect.y, this.dropRect.width, this.dropRect.height, 16);

    const rack = this.rackOverlay;
    if (!rack) {
      return;
    }
    rack.clear();

    const rackHeight = height * 0.16;
    const rackY = height - rackHeight * 0.85;
    const rackX = width * 0.05;
    const rackWidth = width * 0.9;

    rack.fillStyle(0x5a3b24, 0.85);
    rack.fillRoundedRect(rackX, rackY, rackWidth, rackHeight, 18);
    rack.fillStyle(0x3f2a1a, 0.9);
    rack.fillRoundedRect(rackX + 10, rackY + 10, rackWidth - 20, rackHeight - 20, 16);
    rack.lineStyle(2, 0x8c6a4b, 0.8);
    rack.strokeRoundedRect(rackX + 6, rackY + 6, rackWidth - 12, rackHeight - 12, 16);
  }

  private createLogo(): void {
    this.logoText = this.add
      .text(0, 0, "Okey 101", {
        fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif",
        fontSize: "20px",
        color: "#f4e8d2",
        letterSpacing: "1px"
      })
      .setAlpha(0.85);
  }

  private updateLogo(): void {
    if (!this.logoText) {
      return;
    }
    this.logoText.setPosition(this.scale.width * 0.06, this.scale.height * 0.08);
  }
}
