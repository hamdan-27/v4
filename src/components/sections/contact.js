import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { srConfig, email } from '@config';
import sr from '@utils/sr';
import { usePrefersReducedMotion } from '@hooks';
import { Icon } from '@components/icons';

const StyledContactSection = styled.section`
  max-width: 600px;
  margin: 0 auto 100px;
  text-align: center;

  @media (max-width: 768px) {
    margin: 0 auto 50px;
  }

  .overline {
    display: block;
    margin-bottom: 20px;
    color: var(--green);
    font-family: var(--font-mono);
    font-size: var(--fz-md);
    font-weight: 400;

    &:before {
      bottom: 0;
      font-size: var(--fz-sm);
    }

    &:after {
      display: none;
    }
  }

  .title {
    font-size: clamp(40px, 5vw, 60px);
  }

  .contact-buttons {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 35px;
    margin-top: 50px;
  }

  .email-link {
    ${({ theme }) => theme.mixins.bigButton};
  }

  .whatsapp-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;

    svg {
      width: 35px;
      height: 35px;
      margin-top: -4px;
    }

    &:hover,
    &:focus {
      transform: translateY(-3px);
    }
  }
`;

const Contact = () => {
  const revealContainer = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    sr.reveal(revealContainer.current, srConfig());
  }, []);

  return (
    <StyledContactSection id="contact" ref={revealContainer}>
      <h2 className="numbered-heading overline">What’s Next?</h2>

      <h2 className="title">Get In Touch</h2>

      <p>
        If you're interested in collaborating or just want to chat, don't hesitate to reach out, my
        inbox is always open! Whether you have a question or just want to say hi, I’ll try my best
        to get back to you!
      </p>

      <div className="contact-buttons">
        <a className="email-link" href={`mailto:${email}`}>
          Say Hello
        </a>
        <a
          className="whatsapp-link"
          href="https://wa.me/+971504142166"
          target="_blank"
          rel="noopener noreferrer">
          <Icon name="Whatsapp" />
        </a>
      </div>
    </StyledContactSection>
  );
};

export default Contact;
