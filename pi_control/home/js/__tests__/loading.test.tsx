import * as React from 'react';
import { render } from '@testing-library/react';
import { LoadingSpinner } from '../loading';

describe('LoadingSpinner Component', () => {
  it('renders correctly with expected container and loader elements', () => {
    const { container } = render(<LoadingSpinner />);
    const cardBody = container.querySelector('.card-body.text-center.col-12');
    expect(cardBody).toBeInTheDocument();

    const loader = container.querySelector('.loader.text-center');
    expect(loader).toBeInTheDocument();
  });

  it('contains loader element as child of card-body', () => {
    const { container } = render(<LoadingSpinner />);
    const cardBody = container.firstElementChild;
    expect(cardBody).not.toBeNull();
    expect(cardBody?.children.length).toBe(1);
    expect(cardBody?.children[0].className).toBe('loader text-center');
  });

  it('matches HTML snapshot structure', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.innerHTML).toBe(
      '<div class="card-body text-center col-12"><div class="loader text-center"></div></div>'
    );
  });
});
