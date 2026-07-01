import { render, screen, fireEvent } from '@testing-library/react'
import Home from '@/app/page'

describe('通信費まるごと試算ツール', () => {
  // ──────────────────────────────
  // 初期表示
  // ──────────────────────────────
  describe('初期表示', () => {
    it('タイトルを表示する', () => {
      render(<Home />)
      expect(screen.getByText('通信費まるごと試算ツール')).toBeInTheDocument()
    })

    it('スライダーの初期値は20GB', () => {
      render(<Home />)
      const slider = screen.getByRole('slider', { name: '月のデータ使用量' })
      expect(Number(slider.getAttribute('value') ?? (slider as HTMLInputElement).value)).toBe(20)
    })

    it('Step2・Step3は折りたたまれている', () => {
      render(<Home />)
      expect(screen.queryByText('現在のキャリア')).not.toBeInTheDocument()
      expect(screen.queryByText('自宅にネット回線がある')).not.toBeInTheDocument()
    })

    it('20GBで楽天モバイルがランキングに表示される', () => {
      render(<Home />)
      expect(screen.getAllByText('楽天モバイル').length).toBeGreaterThan(0)
    })

    it('20GBで楽天モバイルが1位のためCTAを表示する', () => {
      render(<Home />)
      expect(screen.getByText('楽天モバイル公式で詳細を見る →')).toBeInTheDocument()
    })
  })

  // ──────────────────────────────
  // スライダー操作 → ランキング連動
  // ──────────────────────────────
  describe('スライダー操作', () => {
    it('3GBに変更するとスライダー値が更新される', () => {
      render(<Home />)
      const slider = screen.getByRole('slider', { name: '月のデータ使用量' })
      fireEvent.change(slider, { target: { value: '3' } })
      expect((slider as HTMLInputElement).value).toBe('3')
    })

    it('3GB時は楽天モバイルが1位でないためCTAが非表示', () => {
      render(<Home />)
      const slider = screen.getByRole('slider', { name: '月のデータ使用量' })
      fireEvent.change(slider, { target: { value: '3' } })
      expect(screen.queryByText('楽天モバイル公式で詳細を見る →')).not.toBeInTheDocument()
    })

    it('15GBに変更すると楽天モバイルが1位でCTAを表示', () => {
      render(<Home />)
      const slider = screen.getByRole('slider', { name: '月のデータ使用量' })
      fireEvent.change(slider, { target: { value: '15' } })
      expect(screen.getByText('楽天モバイル公式で詳細を見る →')).toBeInTheDocument()
    })

    it('21GBに変更すると容量不足プランの警告が表示される', () => {
      render(<Home />)
      const slider = screen.getByRole('slider', { name: '月のデータ使用量' })
      fireEvent.change(slider, { target: { value: '21' } })
      expect(screen.getByText(/容量不足プラン/)).toBeInTheDocument()
    })

    it('21GBではカバードプランで楽天モバイルが1位のためCTAを表示', () => {
      render(<Home />)
      const slider = screen.getByRole('slider', { name: '月のデータ使用量' })
      fireEvent.change(slider, { target: { value: '21' } })
      expect(screen.getByText('楽天モバイル公式で詳細を見る →')).toBeInTheDocument()
    })

    it('50GBでも容量不足プラン警告が表示される', () => {
      render(<Home />)
      const slider = screen.getByRole('slider', { name: '月のデータ使用量' })
      fireEvent.change(slider, { target: { value: '50' } })
      expect(screen.getByText(/容量不足プラン/)).toBeInTheDocument()
    })
  })

  // ──────────────────────────────
  // Step2 折りたたみ
  // ──────────────────────────────
  describe('Step2 折りたたみ', () => {
    it('クリックすると展開する', () => {
      render(<Home />)
      const btn = screen.getByRole('button', { name: /今の料金と比較する/ })
      fireEvent.click(btn)
      expect(screen.getByText('現在のキャリア')).toBeInTheDocument()
    })

    it('2回クリックすると再び折りたたまれる', () => {
      render(<Home />)
      const btn = screen.getByRole('button', { name: /今の料金と比較する/ })
      fireEvent.click(btn)
      fireEvent.click(btn)
      expect(screen.queryByText('現在のキャリア')).not.toBeInTheDocument()
    })

    it('展開後にキャリア選択・月額入力フォームが表示される', () => {
      render(<Home />)
      const btn = screen.getByRole('button', { name: /今の料金と比較する/ })
      fireEvent.click(btn)
      expect(screen.getByText('現在のキャリア')).toBeInTheDocument()
      expect(screen.getByText('現在の月額（税込）')).toBeInTheDocument()
    })
  })

  // ──────────────────────────────
  // Step3 折りたたみ
  // ──────────────────────────────
  describe('Step3 折りたたみ', () => {
    it('クリックすると展開する', () => {
      render(<Home />)
      const btn = screen.getByRole('button', { name: /自宅ネットもまとめて試算/ })
      fireEvent.click(btn)
      expect(screen.getByText('自宅にネット回線がある')).toBeInTheDocument()
    })

    it('2回クリックすると再び折りたたまれる', () => {
      render(<Home />)
      const btn = screen.getByRole('button', { name: /自宅ネットもまとめて試算/ })
      fireEvent.click(btn)
      fireEvent.click(btn)
      expect(screen.queryByText('自宅にネット回線がある')).not.toBeInTheDocument()
    })
  })

  // ──────────────────────────────
  // CTA表示条件
  // ──────────────────────────────
  describe('CTA表示条件', () => {
    it('15GB（楽天1位）：CTAあり', () => {
      render(<Home />)
      fireEvent.change(screen.getByRole('slider', { name: '月のデータ使用量' }), {
        target: { value: '15' },
      })
      expect(screen.getByText('楽天モバイル公式で詳細を見る →')).toBeInTheDocument()
    })

    it('3GB（楽天3位）：CTAなし', () => {
      render(<Home />)
      fireEvent.change(screen.getByRole('slider', { name: '月のデータ使用量' }), {
        target: { value: '3' },
      })
      expect(screen.queryByText('楽天モバイル公式で詳細を見る →')).not.toBeInTheDocument()
    })

    it('21GB（カバードプランで楽天1位）：CTAあり', () => {
      render(<Home />)
      fireEvent.change(screen.getByRole('slider', { name: '月のデータ使用量' }), {
        target: { value: '21' },
      })
      expect(screen.getByText('楽天モバイル公式で詳細を見る →')).toBeInTheDocument()
    })

    it('100GB（カバードプランで楽天1位）：CTAあり', () => {
      render(<Home />)
      fireEvent.change(screen.getByRole('slider', { name: '月のデータ使用量' }), {
        target: { value: '100' },
      })
      expect(screen.getByText('楽天モバイル公式で詳細を見る →')).toBeInTheDocument()
    })
  })
})
