import { getRankedPlans, calcDiff, calcRakutenHikari } from '@/lib/calc'

// ──────────────────────────────────────────
// getRankedPlans
// ──────────────────────────────────────────
describe('getRankedPlans', () => {
  describe('3GB', () => {
    const plans = getRankedPlans(3)

    it('全プランが容量をカバーする', () => {
      expect(plans.every((p) => p.coversFully)).toBe(true)
    })

    it('最安は990円（povo）でrank=1', () => {
      const rank1 = plans.find((p) => p.rank === 1)
      expect(rank1?.price).toBe(990)
      expect(rank1?.carrier).toBe('povo')
    })

    it('楽天モバイルは1078円でrank=3', () => {
      const rakuten = plans.find((p) => p.carrier === '楽天モバイル')
      expect(rakuten?.price).toBe(1078)
      expect(rakuten?.rank).toBe(3)
    })

    it('rank=1はちょうど1プランのみ', () => {
      expect(plans.filter((p) => p.rank === 1).length).toBe(1)
    })

    it('isRakutenフラグは楽天モバイルのみtrue', () => {
      plans.forEach((p) => {
        expect(p.isRakuten).toBe(p.carrier === '楽天モバイル')
      })
    })
  })

  describe('15GB', () => {
    const plans = getRankedPlans(15)

    it('全プランが容量をカバーする', () => {
      expect(plans.every((p) => p.coversFully)).toBe(true)
    })

    it('楽天モバイルが最安（2178円）でrank=1', () => {
      const rank1 = plans.find((p) => p.rank === 1)
      expect(rank1?.carrier).toBe('楽天モバイル')
      expect(rank1?.price).toBe(2178)
    })
  })

  describe('21GB（ahamo/povo/LINEMO/UQモバイルが容量不足）', () => {
    const plans = getRankedPlans(21)

    it('楽天モバイルはcoversFully=true（無制限プランあり・3278円）', () => {
      const rakuten = plans.find((p) => p.carrier === '楽天モバイル')
      expect(rakuten?.coversFully).toBe(true)
      expect(rakuten?.price).toBe(3278)
      expect(rakuten?.tierLabel).toBe('無制限')
    })

    it.each(['ahamo', 'povo', 'LINEMO', 'UQモバイル'])(
      '%s は coversFully=false',
      (carrier) => {
        const plan = plans.find((p) => p.carrier === carrier)
        expect(plan?.coversFully).toBe(false)
      }
    )

    it.each(['docomo eximo', 'au使い放題MAX 5G', 'SoftBankメリハリ無制限'])(
      '%s は coversFully=true（無制限）',
      (carrier) => {
        const plan = plans.find((p) => p.carrier === carrier)
        expect(plan?.coversFully).toBe(true)
      }
    )
  })

  describe('50GB', () => {
    const plans = getRankedPlans(50)
    const coveredCarriers = plans.filter((p) => p.coversFully).map((p) => p.carrier)

    it('無制限プラン4つのみカバー', () => {
      expect(coveredCarriers).toContain('楽天モバイル')
      expect(coveredCarriers).toContain('au使い放題MAX 5G')
      expect(coveredCarriers).toContain('SoftBankメリハリ無制限')
      expect(coveredCarriers).toContain('docomo eximo')
      expect(coveredCarriers).not.toContain('ahamo')
      expect(coveredCarriers).not.toContain('povo')
      expect(coveredCarriers).not.toContain('LINEMO')
      expect(coveredCarriers).not.toContain('UQモバイル')
    })

    it('楽天モバイルが最安のカバードプラン（3278円）', () => {
      const covered = plans.filter((p) => p.coversFully)
      const cheapest = covered.reduce((a, b) => (a.price <= b.price ? a : b))
      expect(cheapest.carrier).toBe('楽天モバイル')
    })
  })

  describe('100GB', () => {
    const plans = getRankedPlans(100)

    it('カバードプランは4つ（無制限のみ）', () => {
      expect(plans.filter((p) => p.coversFully).length).toBe(4)
    })

    it('カバードプランの中で楽天モバイルが最安（3278円）', () => {
      const covered = plans.filter((p) => p.coversFully)
      const cheapest = covered.reduce((a, b) => (a.price <= b.price ? a : b))
      expect(cheapest.carrier).toBe('楽天モバイル')
      expect(cheapest.price).toBe(3278)
    })
  })

  describe('ランク付けの整合性', () => {
    it.each([3, 15, 21, 50, 100])(
      '%sGB: rank=1は必ず1プランのみ',
      (gb) => {
        const plans = getRankedPlans(gb)
        expect(plans.filter((p) => p.rank === 1).length).toBe(1)
      }
    )

    it('ランクは1〜8の連続した整数', () => {
      const plans = getRankedPlans(20)
      const sorted = plans.map((p) => p.rank).sort((a, b) => a - b)
      expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    })

    it('ランクは価格昇順に対応（同価格は安定ソート）', () => {
      const plans = getRankedPlans(20)
      for (let i = 0; i < plans.length - 1; i++) {
        expect(plans[i].price).toBeLessThanOrEqual(plans[i + 1].price)
      }
    })
  })
})

// ──────────────────────────────────────────
// calcDiff
// ──────────────────────────────────────────
describe('calcDiff', () => {
  it('月額差・年額差・3年累計差を正確に計算する', () => {
    const result = calcDiff(7315, 1078)
    expect(result.monthly).toBe(6237)
    expect(result.yearly).toBe(6237 * 12)   // 74844
    expect(result.threeYear).toBe(6237 * 36) // 224532
  })

  it('同額の場合はすべて0', () => {
    const result = calcDiff(2970, 2970)
    expect(result.monthly).toBe(0)
    expect(result.yearly).toBe(0)
    expect(result.threeYear).toBe(0)
  })

  it('新プランが高い場合は負値（増額）', () => {
    const result = calcDiff(3000, 5000)
    expect(result.monthly).toBe(-2000)
    expect(result.yearly).toBe(-24000)
    expect(result.threeYear).toBe(-72000)
  })

  it('yearly = monthly × 12', () => {
    const result = calcDiff(5000, 2000)
    expect(result.yearly).toBe(result.monthly * 12)
  })

  it('threeYear = monthly × 36', () => {
    const result = calcDiff(5000, 2000)
    expect(result.threeYear).toBe(result.monthly * 36)
  })
})

// ──────────────────────────────────────────
// calcRakutenHikari
// ──────────────────────────────────────────
describe('calcRakutenHikari', () => {
  it('マンション×楽天モバイルセット：6ヶ月無料で試算', () => {
    const result = calcRakutenHikari(5500, 'mansion', true)
    expect(result.hikariPrice).toBe(4180)
    expect(result.freePeriod).toBe(6)
    expect(result.firstYearCost).toBe(4180 * 6)        // 25080
    expect(result.firstYearSaving).toBe(5500 * 12 - 4180 * 6) // 40920
    expect(result.annualSaving).toBe(5500 * 12 - 4180 * 12)   // 15840
  })

  it('戸建て×セットなし：無料期間なし・12ヶ月分で試算', () => {
    const result = calcRakutenHikari(5500, 'house', false)
    expect(result.hikariPrice).toBe(5200)
    expect(result.freePeriod).toBe(0)
    expect(result.firstYearCost).toBe(5200 * 12)
    expect(result.annualSaving).toBe(5500 * 12 - 5200 * 12) // 3600
  })

  it('現在より高い場合：annualSavingが負（年間増額）', () => {
    const result = calcRakutenHikari(4000, 'mansion', true)
    expect(result.annualSaving).toBe(4000 * 12 - 4180 * 12) // -2160
    expect(result.annualSaving).toBeLessThan(0)
  })

  it('freePeriodはwithRakutenMobileがtrueのとき6、falseのとき0', () => {
    expect(calcRakutenHikari(5000, 'mansion', true).freePeriod).toBe(6)
    expect(calcRakutenHikari(5000, 'mansion', false).freePeriod).toBe(0)
  })
})
