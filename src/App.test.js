import { render, screen } from '@testing-library/react';
import App from './App';

test('renders dashboard heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/humidity and temperature monitoring/i);
  expect(headingElement).toBeInTheDocument();
});
