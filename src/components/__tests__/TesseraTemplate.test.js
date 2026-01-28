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

  it('display formatted dataNascita correctly', () => {
    const wrapper = mount(TesseraTemplate, {
      props: defaultProps,
    })

    const dataNascitaValues = wrapper.findAll('.info-value')
    // 0 is name, 1 is birthdate
    expect(dataNascitaValues[1].text()).toBe('15 Maggio 1980')
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

  it('shows pdf message when template is configured but no image', () => {
     const wrapper = mount(TesseraTemplate, {
      props: {
        ...defaultProps,
        hasPdfTemplate: true,
        backgroundImage: null
      },
    })
    expect(wrapper.find('.pdf-template-message').exists()).toBe(true)
  })
})
