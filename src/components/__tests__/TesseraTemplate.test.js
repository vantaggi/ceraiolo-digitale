import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TesseraTemplate from '../TesseraTemplate.vue'

describe('TesseraTemplate', () => {
  const defaultProps = {
    nomeCognome: 'Mario Rossi',
    dataNascita: '1980-05-15',
    anno: 2024,
  }

  it('renders correctly with required props', () => {
    const wrapper = mount(TesseraTemplate, {
      props: defaultProps,
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.classes()).toContain('tessera-vertical')
  })

  it('displays nomeCognome correctly', () => {
    const wrapper = mount(TesseraTemplate, {
      props: defaultProps,
    })

    const socioValue = wrapper.find('.info-value')
    expect(socioValue.text()).toBe('Mario Rossi')
  })

  it('displays dataNascita correctly', () => {
    const wrapper = mount(TesseraTemplate, {
      props: defaultProps,
    })

    const dataNascitaValues = wrapper.findAll('.info-value')
    expect(dataNascitaValues[1].text()).toBe('1980-05-15')
  })

  it('displays anno correctly', () => {
    const wrapper = mount(TesseraTemplate, {
      props: defaultProps,
    })

    const annoValues = wrapper.findAll('.info-value')
    expect(annoValues[2].text()).toBe('2024')
  })

  it('applies background image when provided', () => {
    const backgroundImage = 'test-image.jpg'
    const wrapper = mount(TesseraTemplate, {
      props: {
        ...defaultProps,
        backgroundImage,
      },
    })

    const tesseraFront = wrapper.find('.tessera-front')
    expect(tesseraFront.attributes('style')).toContain(
      `background-image: url("${backgroundImage}")`,
    )
  })

  it('does not apply background image when not provided', () => {
    const wrapper = mount(TesseraTemplate, {
      props: defaultProps,
    })

    const tesseraFront = wrapper.find('.tessera-front')
    expect(tesseraFront.attributes('style')).toBeUndefined()
  })

  it('renders SVG logo correctly', () => {
    const wrapper = mount(TesseraTemplate, {
      props: defaultProps,
    })

    const logo = wrapper.find('.logo')
    expect(logo.exists()).toBe(true)
    expect(logo.attributes('viewBox')).toBe('0 0 100 100')
  })

  it('renders flame decoration', () => {
    const wrapper = mount(TesseraTemplate, {
      props: defaultProps,
    })

    const flameDecoration = wrapper.find('.flame-decoration')
    expect(flameDecoration.exists()).toBe(true)
  })

  it('renders footer pattern', () => {
    const wrapper = mount(TesseraTemplate, {
      props: defaultProps,
    })

    const footerPattern = wrapper.find('.footer-pattern')
    expect(footerPattern.exists()).toBe(true)
  })

  it('accepts anno as string', () => {
    const wrapper = mount(TesseraTemplate, {
      props: {
        ...defaultProps,
        anno: '2024',
      },
    })

    const annoValues = wrapper.findAll('.info-value')
    expect(annoValues[2].text()).toBe('2024')
  })

  it('has correct structure with all sections', () => {
    const wrapper = mount(TesseraTemplate, {
      props: defaultProps,
    })

    expect(wrapper.find('.header-section').exists()).toBe(true)
    expect(wrapper.find('.member-info').exists()).toBe(true)
    expect(wrapper.find('.flame-decoration').exists()).toBe(true)
    expect(wrapper.find('.footer-pattern').exists()).toBe(true)
  })
})
