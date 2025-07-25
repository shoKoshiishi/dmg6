import { useState, useEffect } from "react";
import { skillsByCategory } from "../data/skills/index";
import { MOTIONS_BY_WEAPON_TYPE } from "../data/weapons/WeaponMotions";
import { MONSTER_LIST } from "../data/monsters/index";
import { calculateDamageTable } from "../services/DamageTableService";
import type { Motion } from "../models/Motion";
import type { WeaponParameters } from "../models/Weapon";
import type { SelectedSkill } from "../models/Skill";
import type { Monster } from "../models/Monster";
import type { SharpnessColor } from "../models/Sharpness";
import type { PresetData } from "../components/common/SaveLoadPreset";
import type { DamageTableRow, ResultType } from "../models/DamageCalculatorTypes";
import type { ItemBuffKey } from "../components/inputs/ItemBuffSection";
import { ITEM_BUFFS } from "../components/inputs/ItemBuffSection";


export function useDamageCalculator() {
  const [weaponInfo, setWeaponInfo] = useState<WeaponParameters>({
    weaponType: "longsword",
    weaponMultiplier: 220,
    baseElementValue: 0,
    elementType: { key: "none", label: "無属性" },
    criticalRate: 5,
  });
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  const [selectedMotions, setSelectedMotions] = useState<Motion[]>([]);
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [damageResult, setDamageResult] = useState<string | null>(null);
  const [damageTableRows, setDamageTableRows] = useState<DamageTableRow[]>([]);
  const [sharpness, setSharpness] = useState<SharpnessColor>("white");
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [results, setResults] = useState<ResultType[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const skillCategories = Object.keys(skillsByCategory) as (keyof typeof skillsByCategory)[];
  const [skillTab, setSkillTab] = useState(0);
  const [selectedBuffs, setSelectedBuffs] = useState<ItemBuffKey[]>([]);

  const availableMotions = MOTIONS_BY_WEAPON_TYPE[weaponInfo.weaponType] || [];

  // アイテムバフ合計値を計算
  const itemBuffsTotal = selectedBuffs
    .map((key) => {
      const buff = ITEM_BUFFS.find((b) => b.key === key);
      return buff ? buff.attack : 0;
    })
    .reduce((a, b) => a + b, 0);

  const handleLoadPreset = (preset: PresetData) => {
    if (!preset) return;
    // Assuming PresetData is now strictly typed, no need for as assertions
    if (preset.weaponInfo) setWeaponInfo(preset.weaponInfo);
    if (preset.selectedSkills) setSelectedSkills(preset.selectedSkills);
    if (preset.selectedMotions) setSelectedMotions(preset.selectedMotions);
    if (preset.selectedMonster) {
      const found = MONSTER_LIST.find((m: Monster) => m.name === preset.selectedMonster?.name);
      setSelectedMonster(found ? found : null);
    }
    if (preset.sharpness) setSharpness(preset.sharpness);
  };

  const handleCalculateDamage = () => {
    if (selectedMotions.length === 0) {
      setErrorMessage("モーションを1つ以上選択してください");
      return;
    }
    if (!selectedMonster) {
      setErrorMessage("モンスターを選択してください");
      return;
    }
    setErrorMessage(null);
    const damageTableRows = calculateDamageTable(
      weaponInfo,
      selectedMotions,
      selectedMonster,
      sharpness,
      selectedSkills,
      itemBuffsTotal
    );
    const result: ResultType = {
      weaponInfo,
      selectedSkills,
      selectedMotions,
      selectedMonster,
      sharpness,
      damageTableRows,
      selectedBuffs: [...selectedBuffs], // 追加
      itemBuffsTotal, // 追加
    };
    setDamageResult(JSON.stringify(result, null, 2));
    setDamageTableRows(damageTableRows);
    setResults((prev) => {
      // すべての履歴を現在のselectedMotionsで再計算 → 削除
      // 直前と同じ内容なら履歴を増やさない
      const prev0 = prev[0];
      if (
        prev0 &&
        JSON.stringify({
          weaponInfo: prev0.weaponInfo,
          selectedSkills: prev0.selectedSkills,
          selectedMotions: prev0.selectedMotions,
          selectedMonster: prev0.selectedMonster,
          sharpness: prev0.sharpness,
          selectedBuffs: prev0.selectedBuffs, // 追加
        }) ===
        JSON.stringify({
          weaponInfo: result.weaponInfo,
          selectedSkills: result.selectedSkills,
          selectedMotions: result.selectedMotions,
          selectedMonster: result.selectedMonster,
          sharpness: result.sharpness,
          selectedBuffs: result.selectedBuffs, // 追加
        })
      ) {
        // 内容が同じならdamageTableRowsだけ更新
        return [{ ...result }, ...prev.slice(1)];
      }
      // 新しい結果を先頭に追加し、履歴は最大20件まで保持
      return [result, ...prev].slice(0, 20);
    });
    if (tabIndex !== 0) setTabIndex(0);
  };

  useEffect(() => {
    setSelectedMotions((prev) =>
      prev.filter((motion) => availableMotions.some((m) => m.name === motion.name))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weaponInfo.weaponType]);

  // selectedMotionsが変わったら全履歴のdamageTableRowsを再計算し、selectedMotionsも揃える
  useEffect(() => {
    setResults((prev) =>
      prev.map((old) => ({
        ...old,
        selectedMotions,
        damageTableRows: calculateDamageTable(
          old.weaponInfo,
          selectedMotions,
          old.selectedMonster,
          old.sharpness,
          old.selectedSkills,
          old.itemBuffsTotal ?? 0
        ),
      }))
    );
  }, [selectedMotions]);

  // アイテムバフ・selectedBuffs依存の再計算・履歴上書きuseEffectは削除

  return {
    weaponInfo, setWeaponInfo,
    selectedSkills, setSelectedSkills,
    selectedMotions, setSelectedMotions,
    selectedMonster, setSelectedMonster,
    damageResult, setDamageResult,
    damageTableRows, setDamageTableRows,
    sharpness, setSharpness,
    presetDialogOpen, setPresetDialogOpen,
    tabIndex, setTabIndex,
    results, setResults,
    errorMessage, setErrorMessage,
    skillCategories, skillTab, setSkillTab,
    availableMotions,
    handleLoadPreset,
    handleCalculateDamage,
    MONSTER_LIST,
    selectedBuffs, setSelectedBuffs,
    itemBuffsTotal,
  };
}
