"use client";

import { useState, useMemo } from "react";
import {
  getRankedPlans,
  calcDiff,
  calcRakutenHikari,
  type RankedPlan,
  type DiffResult,
  type HomeType,
} from "@/lib/calc";
import { CARRIER_LIST } from "@/lib/plans";

/* ------------------------------------------------------------------ */
/* Presentational helpers                                               */
/* ------------------------------------------------------------------ */

function diffLabel(value: number) {
  if (value === 0) return "±0";
  return (value > 0 ? "▼" : "▲") + " " + Math.abs(value).toLocaleString("ja-JP");
}

function DiffCard({ value, label }: { value: number; label: string }) {
  const isPositive = value > 0;
  const isZero = value === 0;
  return (
    <div className="flex flex-col items-center bg-white rounded-xl border border-gray-100 p-3">
      <span className="text-xs text-gray-400 mb-1">{label}</span>
      <span
        className={`text-xl font-bold leading-tight ${
          isZero ? "text-gray-300" : isPositive ? "text-[#bf0000]" : "text-gray-500"
        }`}
      >
        {diffLabel(value)}
        <span className="text-sm font-normal">円</span>
      </span>
      {!isZero && (
        <span className="text-[10px] text-gray-400 mt-0.5">
          {isPositive ? "節約" : "増加"}
        </span>
      )}
    </div>
  );
}

function SectionToggle({
  step,
  label,
  open,
  onToggle,
}: {
  step: number;
  label: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors min-h-[52px]"
    >
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center font-bold flex-shrink-0">
          {step}
        </span>
        <span className="font-semibold text-gray-800 text-sm">{label}</span>
        <span className="text-xs text-gray-400">（任意）</span>
      </div>
      <span
        className="text-gray-400 text-xs transition-transform duration-200"
        style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
      >
        ▼
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Main page                                                            */
/* ------------------------------------------------------------------ */

export default function Home() {
  /* Step 1 */
  const [usageGB, setUsageGB] = useState(20);

  /* Step 2 */
  const [step2Open, setStep2Open] = useState(false);
  const [currentCarrier, setCurrentCarrier] = useState("");
  const [currentMonthly, setCurrentMonthly] = useState("");

  /* Step 3 */
  const [step3Open, setStep3Open] = useState(false);
  const [hasHomeNet, setHasHomeNet] = useState(false);
  const [homeNetFee, setHomeNetFee] = useState("");
  const [homeType, setHomeType] = useState<HomeType>("mansion");
  const [withRakutenMobile, setWithRakutenMobile] = useState(true);

  /* Derived: split into plans that cover the usage vs. those that don't */
  const allRankedPlans = useMemo(() => getRankedPlans(usageGB), [usageGB]);

  const coveredPlans = useMemo(
    () =>
      allRankedPlans
        .filter((p) => p.coversFully)
        .map((p, i) => ({ ...p, rank: i + 1 })),
    [allRankedPlans]
  );

  const uncoveredPlans = useMemo(
    () => allRankedPlans.filter((p) => !p.coversFully),
    [allRankedPlans]
  );

  const cheapest = coveredPlans[0] ?? allRankedPlans[0];
  const currentMonthlyNum = Number(currentMonthly) || 0;
  const homeNetFeeNum = Number(homeNetFee) || 0;

  const diffVsCheapest: DiffResult | null =
    currentMonthlyNum > 0 ? calcDiff(currentMonthlyNum, cheapest.price) : null;

  /* Max monthly saving among covered plans — used for Step 2 highlight */
  const maxSavingMonthly = useMemo(() => {
    if (currentMonthlyNum <= 0 || coveredPlans.length === 0) return -Infinity;
    return Math.max(
      ...coveredPlans.map((p) => calcDiff(currentMonthlyNum, p.price).monthly)
    );
  }, [currentMonthlyNum, coveredPlans]);

  const hikariCalc =
    hasHomeNet && homeNetFeeNum > 0
      ? calcRakutenHikari(homeNetFeeNum, homeType, withRakutenMobile)
      : null;

  const sliderPct = (usageGB / 100) * 100;

  return (
    <main className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-[720px] mx-auto">
        {/* ── Header（修正1：公式タグ削除） ── */}
        <header className="mb-10">
          <h1 className="text-[1.8rem] font-bold text-gray-900 leading-snug">
            通信費まるごと<br className="sm:hidden" />試算ツール
          </h1>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">
            盛らず・煽らず。あなたの使い方に合った最安プランを正直に比較します。
          </p>
        </header>

        {/* ── Step 1: Slider & Ranking ── */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-full bg-[#bf0000] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
              1
            </span>
            <span className="font-semibold text-gray-800">月のデータ使用量を選ぶ</span>
          </div>

          {/* Slider card */}
          <div className="bg-gray-50 rounded-2xl px-6 pt-6 pb-5 mb-6">
            <div className="text-center mb-5">
              <span className="text-6xl font-bold text-gray-900 tabular-nums">
                {usageGB}
              </span>
              <span className="text-2xl text-gray-400 ml-1">GB</span>
              <span className="text-sm text-gray-400 ml-1">/ 月</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={usageGB}
              onChange={(e) => setUsageGB(Number(e.target.value))}
              className="w-full"
              style={{
                background: `linear-gradient(to right, #bf0000 ${sliderPct}%, #e5e7eb ${sliderPct}%)`,
              }}
              aria-label="月のデータ使用量"
            />
            <div className="flex justify-between text-xs text-gray-300 mt-2 select-none">
              <span>0GB</span>
              <span>25GB</span>
              <span>50GB</span>
              <span>75GB</span>
              <span>100GB</span>
            </div>
          </div>

          {/* 修正2：カバープランのランキング（1位基準で赤ハイライト） */}
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            全プラン 最安順ランキング
          </h2>
          <div className="space-y-2">
            {coveredPlans.map((plan) => (
              <PlanCard key={plan.carrier} plan={plan} />
            ))}
          </div>

          {/* 修正2：容量不足プランをグレーアウトして分離 */}
          {uncoveredPlans.length > 0 && (
            <div className="mt-5">
              <p className="text-xs text-amber-600 mb-2 flex items-center gap-1">
                <span>⚠</span>
                容量不足プラン（参考・選択中の使用量に対応しません）
              </p>
              <div className="space-y-1.5">
                {uncoveredPlans.map((plan) => (
                  <UncoveredPlanCard key={plan.carrier} plan={plan} />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Step 2: Current fee comparison ── */}
        <section className="mb-3">
          <SectionToggle
            step={2}
            label="今の料金と比較する"
            open={step2Open}
            onToggle={() => setStep2Open((v) => !v)}
          />
          {step2Open && (
            <div className="mt-2 p-5 rounded-2xl border border-gray-100 bg-gray-50 space-y-4">
              {/* Carrier select */}
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">
                  現在のキャリア
                </label>
                <select
                  value={currentCarrier}
                  onChange={(e) => setCurrentCarrier(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#bf0000]/40 min-h-[48px]"
                >
                  <option value="">選択してください</option>
                  {CARRIER_LIST.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monthly fee */}
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">
                  現在の月額（税込）
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={currentMonthly}
                    onChange={(e) => setCurrentMonthly(e.target.value)}
                    placeholder="例: 7315"
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#bf0000]/40 min-h-[48px]"
                  />
                  <span className="text-sm text-gray-400 flex-shrink-0">円 / 月</span>
                </div>
              </div>

              {/* Diff summary vs cheapest covered plan */}
              {diffVsCheapest && (
                <div>
                  <p className="text-xs text-gray-400 mb-3">
                    最安プラン（{cheapest.carrier}・{cheapest.price.toLocaleString()}円）に切り替えた場合
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    <DiffCard value={diffVsCheapest.monthly} label="月額差" />
                    <DiffCard value={diffVsCheapest.yearly} label="年額差" />
                    <DiffCard value={diffVsCheapest.threeYear} label="3年累計差" />
                  </div>

                  {/* 修正3：節約最大の行をハイライト（covered のみ） */}
                  <h3 className="text-xs text-gray-400 mb-2">各プランとの差額</h3>
                  <div className="space-y-1.5">
                    {coveredPlans.map((plan) => {
                      const d = calcDiff(currentMonthlyNum, plan.price);
                      const isBest =
                        d.monthly > 0 && d.monthly === maxSavingMonthly;
                      return (
                        <div
                          key={plan.carrier}
                          className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                            isBest
                              ? "bg-red-50 border border-[#bf0000]/20"
                              : "bg-white border border-gray-100"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {plan.carrier}
                            </p>
                            <p className="text-xs text-gray-400">{plan.tierLabel}</p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-sm font-bold ${
                                d.monthly > 0
                                  ? "text-[#bf0000]"
                                  : d.monthly < 0
                                  ? "text-gray-500"
                                  : "text-gray-300"
                              }`}
                            >
                              {diffLabel(d.monthly)}円/月
                            </p>
                            <p className="text-xs text-gray-400">
                              {diffLabel(d.yearly)}円/年
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 容量不足プランの差額（参考・グレー） */}
                  {uncoveredPlans.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-amber-600 mb-2 flex items-center gap-1">
                        <span>⚠</span>
                        容量不足プラン（参考）
                      </p>
                      <div className="space-y-1.5">
                        {uncoveredPlans.map((plan) => {
                          const d = calcDiff(currentMonthlyNum, plan.price);
                          return (
                            <div
                              key={plan.carrier}
                              className="flex items-center justify-between rounded-xl px-4 py-3 bg-gray-50 border border-gray-100 opacity-60"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-500">
                                  {plan.carrier}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {plan.tierLabel} ※容量不足
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-400">
                                  {diffLabel(d.monthly)}円/月
                                </p>
                                <p className="text-xs text-gray-400">
                                  {diffLabel(d.yearly)}円/年
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Step 3: Home internet ── */}
        <section className="mb-10">
          <SectionToggle
            step={3}
            label="自宅ネットもまとめて試算"
            open={step3Open}
            onToggle={() => setStep3Open((v) => !v)}
          />
          {step3Open && (
            <div className="mt-2 p-5 rounded-2xl border border-gray-100 bg-gray-50 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={hasHomeNet}
                  onChange={(e) => setHasHomeNet(e.target.checked)}
                  className="w-5 h-5 accent-[#bf0000] cursor-pointer flex-shrink-0"
                />
                <span className="text-sm text-gray-800">自宅にネット回線がある</span>
              </label>

              {hasHomeNet && (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1">
                      現在の自宅ネット月額（税込）
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={homeNetFee}
                        onChange={(e) => setHomeNetFee(e.target.value)}
                        placeholder="例: 5500"
                        className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#bf0000]/40 min-h-[48px]"
                      />
                      <span className="text-sm text-gray-400 flex-shrink-0">円 / 月</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-2">住宅タイプ</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      {(
                        [
                          { value: "mansion", label: "マンション", price: "4,180" },
                          { value: "house", label: "戸建て", price: "5,200" },
                        ] as const
                      ).map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-2 cursor-pointer min-h-[44px]"
                        >
                          <input
                            type="radio"
                            name="homeType"
                            value={opt.value}
                            checked={homeType === opt.value}
                            onChange={() => setHomeType(opt.value)}
                            className="accent-[#bf0000]"
                          />
                          <span className="text-sm text-gray-700">
                            {opt.label}
                            <span className="text-xs text-gray-400 ml-1">
                              （楽天ひかり {opt.price}円/月）
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={withRakutenMobile}
                      onChange={(e) => setWithRakutenMobile(e.target.checked)}
                      className="w-5 h-5 accent-[#bf0000] cursor-pointer flex-shrink-0 mt-0.5"
                    />
                    <span className="text-sm text-gray-800 leading-snug">
                      楽天モバイルとセットで申し込む
                      <span className="ml-1.5 text-[#bf0000] text-xs font-semibold">
                        最大6ヶ月無料
                      </span>
                    </span>
                  </label>

                  {/* 楽天ひかり試算結果（Step 3の文脈なので楽天訴求OK） */}
                  {hikariCalc && (
                    <div className="bg-white rounded-xl border border-[#bf0000]/20 p-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-4">
                        楽天ひかりに切り替えた場合
                      </h3>
                      <div className="space-y-3 text-sm">
                        <Row
                          label="楽天ひかり月額"
                          value={`${hikariCalc.hikariPrice.toLocaleString()}円/月`}
                        />
                        {hikariCalc.freePeriod > 0 && (
                          <Row
                            label="楽天モバイルセット特典"
                            value={`最大${hikariCalc.freePeriod}ヶ月無料`}
                            highlight
                          />
                        )}
                        <Row
                          label="現在の年間費用"
                          value={`${(homeNetFeeNum * 12).toLocaleString()}円`}
                        />
                        <Row
                          label={`初年度費用（${hikariCalc.freePeriod > 0 ? 12 - hikariCalc.freePeriod : 12}ヶ月分）`}
                          value={`${hikariCalc.firstYearCost.toLocaleString()}円`}
                        />
                        <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                          <span
                            className={`font-semibold ${
                              hikariCalc.firstYearSaving >= 0
                                ? "text-[#bf0000]"
                                : "text-gray-500"
                            }`}
                          >
                            初年度
                            {hikariCalc.firstYearSaving >= 0 ? "節約" : "増額"}
                          </span>
                          <span
                            className={`text-2xl font-bold ${
                              hikariCalc.firstYearSaving >= 0
                                ? "text-[#bf0000]"
                                : "text-gray-500"
                            }`}
                          >
                            {hikariCalc.firstYearSaving >= 0 ? "▼" : "▲"}
                            {Math.abs(hikariCalc.firstYearSaving).toLocaleString()}円
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span className="text-xs">2年目以降（年間）</span>
                          <span className="text-sm font-semibold">
                            {hikariCalc.annualSaving >= 0 ? "▼" : "▲"}
                            {Math.abs(hikariCalc.annualSaving).toLocaleString()}円
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        {/* ── Footer ── */}
        <footer className="text-[11px] text-gray-300 text-center pb-8 space-y-1">
          <p>料金はすべて税込表示。実際の料金は各社公式サイトでご確認ください。</p>
          <p>楽天ひかりのキャンペーン内容は時期により変更になる場合があります。</p>
        </footer>
      </div>
    </main>
  );
}

/* ── Sub-components ── */

/** ランキング1位のみ赤ハイライト（修正4：isRakuten依存を完全排除） */
function PlanCard({ plan }: { plan: RankedPlan }) {
  const isFirst = plan.rank === 1;
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
        isFirst ? "border-[#bf0000]/30 bg-red-50" : "border-gray-100 bg-white"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
          isFirst
            ? "bg-[#bf0000] text-white"
            : plan.rank <= 3
            ? "bg-gray-100 text-gray-600"
            : "bg-gray-50 text-gray-400"
        }`}
      >
        {plan.rank}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`font-semibold text-sm truncate ${
            isFirst ? "text-[#bf0000]" : "text-gray-800"
          }`}
        >
          {plan.carrier}
        </p>
        <p className="text-xs text-gray-400">{plan.tierLabel}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p
          className={`text-[1.3rem] font-bold tabular-nums leading-none ${
            isFirst ? "text-[#bf0000]" : "text-gray-900"
          }`}
        >
          {plan.price.toLocaleString()}
          <span className="text-xs font-normal text-gray-400 ml-0.5">円</span>
        </p>
        <p className="text-[10px] text-gray-300 mt-0.5">月額（税込）</p>
      </div>
    </div>
  );
}

/** 容量不足プラン用グレーカード */
function UncoveredPlanCard({ plan }: { plan: RankedPlan }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 opacity-55">
      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        <span className="text-gray-400 text-xs font-bold">—</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-500 truncate">{plan.carrier}</p>
        <p className="text-xs text-gray-400">
          {plan.tierLabel}{" "}
          <span className="text-amber-500">※容量不足</span>
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-base font-semibold tabular-nums text-gray-400">
          {plan.price.toLocaleString()}
          <span className="text-xs font-normal ml-0.5">円</span>
        </p>
        <p className="text-[10px] text-gray-300">月額（税込）</p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span
        className={`font-semibold ${highlight ? "text-[#bf0000]" : "text-gray-800"}`}
      >
        {value}
      </span>
    </div>
  );
}
