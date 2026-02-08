import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatCard } from '@/components/dashboard/stat-card';
import { Users } from 'lucide-react';

describe('StatCard', () => {
  it('renders the card with title, value, and description', () => {
    render(
      <StatCard
        title="Kabuuang Magsasaka"
        value="150"
        icon={Users}
        description="Lahat ng aprubadong magsasaka sa database."
      />
    );

    // Check if the title is rendered
    expect(screen.getByText('Kabuuang Magsasaka')).toBeInTheDocument();

    // Check if the value is rendered
    expect(screen.getByText('150')).toBeInTheDocument();

    // Check if the description is rendered
    expect(screen.getByText('Lahat ng aprubadong magsasaka sa database.')).toBeInTheDocument();
  });
});
