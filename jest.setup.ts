import '@testing-library/jest-dom'

// Vercel Analytics はテスト環境では no-op にモック（CVRクリック計測 track の副作用を回避）
jest.mock('@vercel/analytics', () => ({ track: jest.fn() }))
