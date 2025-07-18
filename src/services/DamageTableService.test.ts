import { describe, it, expect } from "vitest";
import { calculateDamageTable } from "./DamageTableService";
import type { WeaponParameters } from "../models/Weapon";
import type { Motion } from "../models/Motion";
import type { Monster, MonsterPartStateDetails } from "../models/Monster";
import type { SharpnessColor } from "../models/Sharpness";
import type { SkillParameters } from "../models/Skill";
import type { MonsterPartState } from "../models/Monster";
// getApplicableSkillsをテスト用にimport
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { getApplicableSkills } from "./DamageTableService";

// モックデータ
const weaponInfo: WeaponParameters = {
  weaponType: "longsword",
  weaponMultiplier: 200,
  baseElementValue: 0,
  elementType: { key: "none", label: "無属性" },
  criticalRate: 0,
};
const motions: Motion[] = [
  {
    name: "test motion",
    motionValue: 30,
    elementMultiplier: 1,
    sharpnessModifier: 1,
    hitCount: 1,
    attackType: "slash",
  },
];
const monster: Monster = {
  name: "test monster",
  parts: [
    {
      name: "head",
      states: [
        {
          state: "normal",
          slashHitZone: 60,
          bluntHitZone: 50,
          shotHitZone: 40,
          fireHitZone: 10,
          waterHitZone: 10,
          iceHitZone: 10,
          thunderHitZone: 10,
          dragonHitZone: 10,
        },
      ],
    },
  ],
};
const sharpness: SharpnessColor = "white";
const skills: { key: string; level: number; skillData: SkillParameters[] }[] = [
  {
    key: "attackBoost",
    level: 1,
    skillData: [
      {
        additionAttackBonus: 10,
        attackMultiplierBonus: 1.1,
        minHitZone: 0,
        maxHitZone: 100,
        applicableStates: ["normal"],
      },
    ],
  },
];

describe("DamageTableServiceのテスト", () => {
  it("calculateDamageTable: 正しい構造の行が返る", () => {
    const rows = calculateDamageTable(
      weaponInfo,
      motions,
      monster,
      sharpness,
      skills
    );
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(1);
    expect(rows[0]).toHaveProperty("part", "head");
    expect(rows[0]).toHaveProperty("state", "normal");
    expect(typeof rows[0].physical).toBe("number");
    expect(typeof rows[0].elemental).toBe("number");
    expect(typeof rows[0].damage).toBe("string");
    expect(typeof rows[0].critDamage).toBe("string");
    expect(typeof rows[0].expected).toBe("string");
  });

  it("calculateDamageTable: モーションが空なら0行", () => {
    const rows = calculateDamageTable(
      weaponInfo,
      [],
      monster,
      sharpness,
      skills
    );
    expect(rows.length).toBe(0);
  });

  it("calculateDamageTable: モンスターがnullなら0行", () => {
    const rows = calculateDamageTable(
      weaponInfo,
      motions,
      null,
      sharpness,
      skills
    );
    expect(rows.length).toBe(0);
  });

  it("calculateDamageTable: スキルなしでも計算できる", () => {
    const rows = calculateDamageTable(
      weaponInfo,
      motions,
      monster,
      sharpness,
      []
    );
    expect(rows.length).toBe(1);
    expect(typeof rows[0].physical).toBe("number");
  });

  it("calculateDamageTable: sharpness未指定時はwhiteで計算", () => {
    const rows = calculateDamageTable(
      weaponInfo,
      motions,
      monster,
      undefined,
      skills
    );
    expect(rows.length).toBe(1);
    expect(typeof rows[0].physical).toBe("number");
  });

  it("getApplicableSkills: 通常スキルが適用される", () => {
    const skills = [
      {
        key: "test",
        level: 1,
        skillData: [
          {
            additionAttackBonus: 10,
            minHitZone: 0,
            maxHitZone: 100,
            applicableStates: ["normal"] as MonsterPartState[],
          },
        ],
      },
    ];
    const motion: Motion = {
      name: "test",
      motionValue: 10,
      elementMultiplier: 1,
      sharpnessModifier: 1,
      hitCount: 1,
      attackType: "slash",
    };
    const state: MonsterPartStateDetails = {
      slashHitZone: 60,
      bluntHitZone: 50,
      shotHitZone: 40,
      fireHitZone: 10,
      waterHitZone: 10,
      iceHitZone: 10,
      thunderHitZone: 10,
      dragonHitZone: 10,
      state: "normal",
    };
    const result = getApplicableSkills(skills, motion, state);
    expect(result.length).toBe(1);
    expect(result[0].additionAttackBonus).toBe(10);
  });

  it("getApplicableSkills: ジャンプ攻撃専用スキルはジャンプ時のみ適用", () => {
    const skills = [
      {
        key: "hien",
        level: 1,
        skillData: [
          {
            attackMultiplierBonus: 1.1,
            minHitZone: 0,
            maxHitZone: 100,
            applicableStates: ["normal"] as MonsterPartState[],
            isJumpAttackOnly: true,
          },
        ],
      },
    ];
    const motionJump: Motion = {
      name: "jump",
      motionValue: 10,
      elementMultiplier: 1,
      sharpnessModifier: 1,
      hitCount: 1,
      attackType: "slash",
      isJump: true,
    };
    const motionNormal: Motion = {
      name: "normal",
      motionValue: 10,
      elementMultiplier: 1,
      sharpnessModifier: 1,
      hitCount: 1,
      attackType: "slash",
    };
    const state: MonsterPartStateDetails = {
      slashHitZone: 60,
      bluntHitZone: 50,
      shotHitZone: 40,
      state: "normal",
      fireHitZone: 10,
      waterHitZone: 10,
      iceHitZone: 10,
      thunderHitZone: 10,
      dragonHitZone: 10,
    };
    expect(getApplicableSkills(skills, motionJump, state).length).toBe(1);
    expect(getApplicableSkills(skills, motionNormal, state).length).toBe(0);
  });

  it("getApplicableSkills: 肉質情報がないスキルは常に適用される", () => {
    const skills = [
      {
        key: "skillWithoutHitZone",
        level: 1,
        skillData: [
          {
            additionAttackBonus: 5,
            minHitZone: 0,
            maxHitZone: 100,
            applicableStates: ["normal"] as MonsterPartState[],
          },
        ],
      },
    ];
    const motion: Motion = {
      name: "test",
      motionValue: 10,
      elementMultiplier: 1,
      sharpnessModifier: 1,
      hitCount: 1,
      attackType: "slash",
    };
    const state: MonsterPartStateDetails = {
      slashHitZone: 60,
      bluntHitZone: 50,
      shotHitZone: 40,
      state: "normal",
      fireHitZone: 10,
      waterHitZone: 10,
      iceHitZone: 10,
      thunderHitZone: 10,
      dragonHitZone: 10,
    };
    const result = getApplicableSkills(skills, motion, state);
    expect(result.length).toBe(1);
    expect(result[0].additionAttackBonus).toBe(5);
  });

  it("getApplicableSkills: 肉質情報があり、範囲内の場合は適用される", () => {
    const skills = [
      {
        key: "skillWithApplicableHitZone",
        level: 1,
        skillData: [
          {
            additionAttackBonus: 10,
            minHitZone: 50,
            maxHitZone: 70,
            applicableStates: ["normal"] as MonsterPartState[],
          },
        ],
      },
    ];
    const motion: Motion = {
      name: "test",
      motionValue: 10,
      elementMultiplier: 1,
      sharpnessModifier: 1,
      hitCount: 1,
      attackType: "slash",
    };
    const state: MonsterPartStateDetails = {
      slashHitZone: 60, // 範囲内
      bluntHitZone: 50,
      shotHitZone: 40,
      state: "normal",
      fireHitZone: 10,
      waterHitZone: 10,
      iceHitZone: 10,
      thunderHitZone: 10,
      dragonHitZone: 10,
    };
    const result = getApplicableSkills(skills, motion, state);
    expect(result.length).toBe(1);
    expect(result[0].additionAttackBonus).toBe(10);
  });

  it("getApplicableSkills: 肉質情報があり、範囲外の場合は適用されない", () => {
    const skills = [
      {
        key: "skillWithInapplicableHitZone",
        level: 1,
        skillData: [
          {
            additionAttackBonus: 10,
            minHitZone: 70,
            maxHitZone: 100,
            applicableStates: ["normal"] as MonsterPartState[],
          },
        ],
      },
    ];
    const motion: Motion = {
      name: "test",
      motionValue: 10,
      elementMultiplier: 1,
      sharpnessModifier: 1,
      hitCount: 1,
      attackType: "slash",
    };
    const state: MonsterPartStateDetails = {
      slashHitZone: 60,
      bluntHitZone: 50,
      shotHitZone: 40,
      state: "normal",
      fireHitZone: 10,
      waterHitZone: 10,
      iceHitZone: 10,
      thunderHitZone: 10,
      dragonHitZone: 10,
    };
    const result = getApplicableSkills(skills, motion, state);
    expect(result.length).toBe(0);
  });

  it("calculateDamageTable: DamageCalculatorに正しいパラメータが渡る", () => {
    // スキル・モーション・モンスター・シャープネスを組み合わせて、物理計算に渡る値を検証
    const testWeapon: WeaponParameters = {
      weaponType: "longsword",
      weaponMultiplier: 150,
      baseElementValue: 0,
      elementType: { key: "none", label: "無属性" },
      criticalRate: 10,
    };
    const testMotion: Motion = {
      name: "test motion",
      motionValue: 20,
      elementMultiplier: 1,
      sharpnessModifier: 1.05,
      hitCount: 1,
      attackType: "slash",
    };
    const testMonster: Monster = {
      name: "test",
      parts: [
        {
          name: "head",
          states: [
            {
              state: "normal",
              slashHitZone: 70,
              bluntHitZone: 60,
              shotHitZone: 50,
              fireHitZone: 0,
              waterHitZone: 0,
              iceHitZone: 0,
              thunderHitZone: 0,
              dragonHitZone: 0,
            },
          ],
        },
      ],
    };
    const testSkills = [
      {
        key: "attackBoost",
        level: 1,
        skillData: [
          {
            additionAttackBonus: 5,
            attackMultiplierBonus: 1.2,
            minHitZone: 0,
            maxHitZone: 100,
            applicableStates: ["normal" as MonsterPartState],
          },
        ],
      },
    ];
    // シャープネス白(1.32)で計算
    const rows = calculateDamageTable(
      testWeapon,
      [testMotion],
      testMonster,
      "white",
      testSkills
    );
    expect(rows.length).toBe(1);
    const row = rows[0];
    // 期待値: (150*1.2+5)*20*1.32*1*70/10000
    const expectedPhysical = ((150 * 1.2 + 5) * 20 * 1.32 * 1 * 70) / 10000;
    // 1ヒットごとに小数第1位で四捨五入
    const expectedPhysicalRounded = Math.round(expectedPhysical * 10) / 10;
    expect(row.physical).toBeCloseTo(expectedPhysicalRounded, 1);
    // パラメータも正しく反映されているか
    expect(row.baseWeaponMultiplier).toBe(150);
    expect(row.attackMultiplierBonus).toBe(1);
    expect(row.additionAttackBonus).toBe(0);
    expect(row.motionValue).toBe(20);
    // sharpnessModifier: white(1.32)を期待値に
    expect(row.sharpnessModifier).toBe(1.32);
    expect(row.criticalDamageModifier).toBe(1);
    expect(row.baseElementValue).toBe(0);
    expect(row.elementMultiplier).toBe(1);
    expect(row.elementAddition).toBe(0);
    expect(row.elementModifier).toBe(1);
  });

  it("calculateDamageTable: 表用の値（DamageCalculatorに渡さない値）も正しく格納される", () => {
    // クリティカルボーナスや表用の値が正しく格納されているか
    const testWeapon: WeaponParameters = {
      weaponType: "longsword",
      weaponMultiplier: 100,
      baseElementValue: 0,
      elementType: { key: "none", label: "無属性" },
      criticalRate: 15,
    };
    const testMotion: Motion = {
      name: "test motion",
      motionValue: 10,
      elementMultiplier: 1,
      sharpnessModifier: 1,
      hitCount: 1,
      attackType: "slash",
    };
    const testMonster: Monster = {
      name: "test",
      parts: [
        {
          name: "head",
          states: [
            {
              state: "normal",
              slashHitZone: 50,
              bluntHitZone: 40,
              shotHitZone: 30,
              fireHitZone: 0,
              waterHitZone: 0,
              iceHitZone: 0,
              thunderHitZone: 0,
              dragonHitZone: 0,
            },
          ],
        },
      ],
    };
    const testSkills = [
      {
        key: "wex",
        level: 1,
        skillData: [
          {
            criticalRateBonus: 20,
            minHitZone: 0,
            maxHitZone: 100,
            applicableStates: ["normal" as MonsterPartState],
          },
        ],
      },
    ];
    const rows = calculateDamageTable(
      testWeapon,
      [testMotion],
      testMonster,
      "white",
      testSkills
    );
    expect(rows.length).toBe(1);
    const row = rows[0];
    // 表用の値: critRate, baseWeaponMultiplier, attackMultiplierBonus, additionAttackBonus, motionValue, sharpnessModifier, criticalDamageModifier, baseElementValue, elementMultiplier, elementAddition, elementModifier
    // critRate = (criticalRate + totalCriticalBonus) / 100
    expect(row.critRate).toBeCloseTo((15 + 20) / 100, 5);
    expect(row.baseWeaponMultiplier).toBe(100);
    expect(row.attackMultiplierBonus).toBe(1);
    expect(row.additionAttackBonus).toBe(0);
    expect(row.motionValue).toBe(10);
    // sharpnessModifier: white(1.32)を期待値に
    expect(row.sharpnessModifier).toBe(1.32);
    expect(row.criticalDamageModifier).toBe(1);
    expect(row.baseElementValue).toBe(0);
    expect(row.elementMultiplier).toBe(1);
    expect(row.elementAddition).toBe(0);
    expect(row.elementModifier).toBe(1);
  });

  it("calculateDamageTable: 太刀の練気ゲージ補正が正しく攻撃力乗算に反映される", () => {
    // 無色→白色→黄色→赤色で物理ダメージが増加することを検証
    const baseParams = {
      weaponType: "longsword" as const,
      weaponMultiplier: 100,
      baseElementValue: 0,
      elementType: { key: "none", label: "無属性" } as const,
      criticalRate: 0,
    };
    const testMotion: Motion = {
      name: "spirit test",
      motionValue: 10,
      elementMultiplier: 1,
      sharpnessModifier: 1,
      hitCount: 1,
      attackType: "slash",
    };
    const testMonster: Monster = {
      name: "test",
      parts: [
        {
          name: "head",
          states: [
            {
              state: "normal",
              slashHitZone: 50,
              bluntHitZone: 40,
              shotHitZone: 30,
              fireHitZone: 0,
              waterHitZone: 0,
              iceHitZone: 0,
              thunderHitZone: 0,
              dragonHitZone: 0,
            },
          ],
        },
      ],
    };
    // 無色
    const rowsNone = calculateDamageTable(
      { ...baseParams, tachiSpiritGauge: "none" },
      [testMotion],
      testMonster,
      "white",
      []
    );
    // 白色
    const rowsWhite = calculateDamageTable(
      { ...baseParams, tachiSpiritGauge: "white" },
      [testMotion],
      testMonster,
      "white",
      []
    );
    // 黄色
    const rowsYellow = calculateDamageTable(
      { ...baseParams, tachiSpiritGauge: "yellow" },
      [testMotion],
      testMonster,
      "white",
      []
    );
    // 赤色
    const rowsRed = calculateDamageTable(
      { ...baseParams, tachiSpiritGauge: "red" },
      [testMotion],
      testMonster,
      "white",
      []
    );
    expect(rowsNone[0].physical).toBeLessThan(rowsWhite[0].physical);
    expect(rowsWhite[0].physical).toBeLessThan(rowsYellow[0].physical);
    expect(rowsYellow[0].physical).toBeLessThan(rowsRed[0].physical);
    // 無色の物理ダメージ * 1.1 ≒ 赤色の物理ダメージ
    const expectedRed = Math.round(rowsNone[0].physical * 1.1 * 10) / 10;
    expect(rowsRed[0].physical).toBeCloseTo(expectedRed, 1);
  });
});
