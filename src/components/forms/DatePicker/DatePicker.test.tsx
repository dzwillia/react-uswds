import React, { ComponentProps } from 'react'
import {
  render,
  fireEvent,
  createEvent,
  waitFor,
  screen,
} from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import { DatePicker } from './DatePicker'
import { sampleLocalization } from './i18n'
import { today } from './utils'
import {
  DAY_OF_WEEK_LABELS,
  MONTH_LABELS,
  VALIDATION_MESSAGE,
} from './constants'

describe('DatePicker component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const testProps = {
    id: 'birthdate',
    name: 'birthdate',
  }

  const renderDatePicker = (
    props?: Omit<ComponentProps<typeof DatePicker>, 'id' | 'name'>
  ) => {
    const allProps = {
      ...testProps,
      ...props,
    }
    const rendered = render(<DatePicker {...allProps} />)
    const queryForDatePicker = () => screen.queryByTestId('date-picker')
    return {
      ...rendered,
      queryForDatePicker,
    }
  }

  it('renders without errors', () => {
    const { queryForDatePicker } = renderDatePicker()
    const datePicker = queryForDatePicker()
    expect(datePicker).toBeInTheDocument()
    expect(datePicker).toHaveClass('usa-date-picker')
  })

  it('renders a hidden "internal" input with the name prop', () => {
    const { getByTestId } = renderDatePicker()
    expect(getByTestId('date-picker-internal-input')).toBeInstanceOf(
      HTMLInputElement
    )
    expect(getByTestId('date-picker-internal-input')).toHaveAttribute(
      'type',
      'text'
    )
    expect(getByTestId('date-picker-internal-input')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
    expect(getByTestId('date-picker-internal-input')).toHaveAttribute(
      'name',
      testProps.name
    )
  })

  it('renders a visible "external" input with the id prop', () => {
    const { getByTestId } = renderDatePicker()
    expect(getByTestId('date-picker-external-input')).toBeInstanceOf(
      HTMLInputElement
    )
    expect(getByTestId('date-picker-external-input')).toHaveAttribute(
      'type',
      'text'
    )
    expect(getByTestId('date-picker-external-input')).toBeVisible()
    expect(getByTestId('date-picker-external-input')).toHaveAttribute(
      'id',
      testProps.id
    )
  })

  it('renders a toggle button', () => {
    const { getByTestId } = renderDatePicker()
    expect(getByTestId('date-picker-button')).toBeInstanceOf(HTMLButtonElement)
    expect(getByTestId('date-picker-button')).toHaveAttribute(
      'aria-label',
      'Toggle calendar'
    )
  })

  it('renders a hidden calendar application element', () => {
    const { getByTestId } = renderDatePicker()
    expect(getByTestId('date-picker-calendar')).toBeInstanceOf(HTMLDivElement)
    expect(getByTestId('date-picker-calendar')).toHaveAttribute(
      'role',
      'application'
    )
    expect(getByTestId('date-picker-calendar')).not.toBeVisible()
  })

  it('renders a screen reader status element', () => {
    const { getByTestId } = renderDatePicker()
    expect(getByTestId('date-picker-status')).toBeInstanceOf(HTMLDivElement)
    expect(getByTestId('date-picker-status')).toHaveAttribute('role', 'status')
    expect(getByTestId('date-picker-status')).toHaveTextContent('')
  })

  // https://github.com/uswds/uswds/blob/develop/spec/unit/date-picker/date-picker.spec.js#L933
  it('prevents default action if keyup doesn’t originate within the calendar', async () => {
    const { getByTestId } = renderDatePicker({ defaultValue: '2021-01-20' })

    const calendarEl = getByTestId('date-picker-calendar')
    await userEvent.click(getByTestId('date-picker-button'))
    expect(calendarEl).toBeVisible()
    const keyUpEvent = createEvent.keyUp(calendarEl, {
      key: 'Enter',
      bubbles: true,
      code: 13,
    })
    const preventDefaultSpy = jest.spyOn(keyUpEvent, 'preventDefault')
    fireEvent(calendarEl, keyUpEvent)
    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  describe('toggling the calendar', () => {
    it('the calendar is hidden on mount', () => {
      const { getByTestId } = renderDatePicker()
      expect(getByTestId('date-picker-calendar')).not.toBeVisible()
      expect(getByTestId('date-picker')).not.toHaveClass(
        'usa-date-picker--active'
      )
    })

    it('shows the calendar when the toggle button is clicked and focuses on the selected date', async () => {
      const { getByTestId, getByText } = renderDatePicker({
        defaultValue: '2021-01-20',
      })
      await userEvent.click(getByTestId('date-picker-button'))
      expect(getByTestId('date-picker-calendar')).toBeVisible()
      expect(getByTestId('date-picker')).toHaveClass('usa-date-picker--active')
      expect(getByText('20')).toHaveClass(
        'usa-date-picker__calendar__date--selected'
      )

      await waitFor(() => {
        expect(getByText('20')).toHaveFocus()
      })
    })

    it('hides the calendar when the escape key is pressed', async () => {
      const { getByTestId } = renderDatePicker()
      await userEvent.click(getByTestId('date-picker-button'))
      expect(getByTestId('date-picker-calendar')).toBeVisible()
      expect(getByTestId('date-picker')).toHaveClass('usa-date-picker--active')

      fireEvent.keyDown(getByTestId('date-picker'), { key: 'Escape' })

      expect(getByTestId('date-picker-calendar')).not.toBeVisible()
      expect(getByTestId('date-picker')).not.toHaveClass(
        'usa-date-picker--active'
      )

      // TODO
      // This broke but only seems to be in JSDom (works as expected in Chrome)
      // expect(getByTestId('date-picker-external-input')).toHaveFocus()
    })

    it('hides the calendar when the toggle button is clicked a second time', async () => {
      const { getByTestId } = renderDatePicker()
      await userEvent.click(getByTestId('date-picker-button'))
      expect(getByTestId('date-picker-calendar')).toBeVisible()
      expect(getByTestId('date-picker')).toHaveClass('usa-date-picker--active')
      await userEvent.click(getByTestId('date-picker-button'))
      expect(getByTestId('date-picker-calendar')).not.toBeVisible()
      expect(getByTestId('date-picker')).not.toHaveClass(
        'usa-date-picker--active'
      )
      expect(getByTestId('date-picker-status')).toHaveTextContent('')
    })

    it('focus defaults to today if there is no value', async () => {
      const todayDate = today()
      const todayLabel = `${todayDate.getDate()} ${
        MONTH_LABELS[todayDate.getMonth()]
      } ${todayDate.getFullYear()} ${DAY_OF_WEEK_LABELS[todayDate.getDay()]}`

      const { getByTestId, getByLabelText } = renderDatePicker()
      await userEvent.click(getByTestId('date-picker-button'))
      await waitFor(() => {
        expect(getByLabelText(todayLabel)).toHaveFocus()
      })
    })

    it('adds Selected date to the status text if the selected date and the focused date are the same', async () => {
      const { getByTestId, getByText } = renderDatePicker({
        defaultValue: '2021-01-20',
      })
      await userEvent.click(getByTestId('date-picker-button'))
      expect(getByTestId('date-picker-calendar')).toBeVisible()
      expect(getByTestId('date-picker')).toHaveClass('usa-date-picker--active')

      await waitFor(() => {
        expect(getByText('20')).toHaveFocus()
      })

      expect(getByTestId('date-picker-status')).toHaveTextContent(
        'Selected date'
      )
    })

    it('coerces the display date to a valid value', async () => {
      const { getByTestId, getByLabelText } = renderDatePicker({
        defaultValue: '2021-01-06',
        minDate: '2021-01-10',
        maxDate: '2021-01-20',
      })
      await userEvent.click(getByTestId('date-picker-button'))
      expect(getByLabelText('6 January 2021 Wednesday')).not.toHaveFocus()

      await waitFor(() => {
        expect(getByLabelText('10 January 2021 Sunday')).toHaveFocus()
      })
    })

    it('hides the calendar if focus moves to another element', async () => {
      const mockOnBlur = jest.fn()
      const { getByTestId } = render(
        <>
          <DatePicker {...testProps} onBlur={mockOnBlur} />
          <input type="text" data-testid="test-external-element" />
        </>
      )

      await userEvent.click(getByTestId('date-picker-button'))
      expect(getByTestId('date-picker-calendar')).toBeVisible()
      getByTestId('test-external-element').focus()
      await waitFor(() =>
        expect(getByTestId('date-picker-calendar')).not.toBeVisible()
      )
      expect(mockOnBlur).toHaveBeenCalled()
    })
  })

  describe('status text', () => {
    it('shows instructions in the status text when the calendar is opened', async () => {
      const { getByTestId } = renderDatePicker({ defaultValue: '2021-01-20' })
      await userEvent.click(getByTestId('date-picker-button'))
      expect(getByTestId('date-picker-calendar')).toBeVisible()
      expect(getByTestId('date-picker')).toHaveClass('usa-date-picker--active')

      expect(getByTestId('date-picker-status')).toHaveTextContent(
        'You can navigate by day using left and right arrows'
      )
      expect(getByTestId('date-picker-status')).toHaveTextContent(
        'Weeks by using up and down arrows'
      )
      expect(getByTestId('date-picker-status')).toHaveTextContent(
        'Months by using page up and page down keys'
      )
      expect(getByTestId('date-picker-status')).toHaveTextContent(
        'Years by using shift plus page up and shift plus page down'
      )
      expect(getByTestId('date-picker-status')).toHaveTextContent(
        'Home and end keys navigate to the beginning and end of a week'
      )
    })

    it('removes instructions from the status text when the calendar is already open and the displayed date changes', async () => {
      const { getByTestId, getByLabelText } = renderDatePicker({
        defaultValue: '2021-01-20',
      })

      await userEvent.click(getByTestId('date-picker-button'))
      expect(getByTestId('date-picker-calendar')).toBeVisible()
      expect(getByTestId('date-picker')).toHaveClass('usa-date-picker--active')

      expect(getByTestId('date-picker-status')).not.toHaveTextContent(
        'January 2021'
      )
      expect(getByTestId('date-picker-status')).toHaveTextContent(
        'You can navigate by day using left and right arrows'
      )
      expect(getByTestId('date-picker-status')).toHaveTextContent(
        'Weeks by using up and down arrows'
      )
      expect(getByTestId('date-picker-status')).toHaveTextContent(
        'Months by using page up and page down keys'
      )
      expect(getByTestId('date-picker-status')).toHaveTextContent(
        'Years by using shift plus page up and shift plus page down'
      )
      expect(getByTestId('date-picker-status')).toHaveTextContent(
        'Home and end keys navigate to the beginning and end of a week'
      )

      await waitFor(() => {
        expect(getByLabelText(/^20 January 2021/)).toHaveFocus()
      })

      fireEvent.mouseMove(getByLabelText(/^13 January 2021/))
      expect(getByLabelText(/^13 January 2021/)).toHaveFocus()

      expect(getByTestId('date-picker-status')).toHaveTextContent(
        'January 2021'
      )
      expect(getByTestId('date-picker-status')).not.toHaveTextContent(
        'You can navigate by day using left and right arrows'
      )
      expect(getByTestId('date-picker-status')).not.toHaveTextContent(
        'Weeks by using up and down arrows'
      )
      expect(getByTestId('date-picker-status')).not.toHaveTextContent(
        'Months by using page up and page down keys'
      )
      expect(getByTestId('date-picker-status')).not.toHaveTextContent(
        'Years by using shift plus page up and shift plus page down'
      )
      expect(getByTestId('date-picker-status')).not.toHaveTextContent(
        'Home and end keys navigate to the beginning and end of a week'
      )
    })

    it('does not add Selected date to the status text if the selected date and the focused date are not the same', async () => {
      const { getByTestId, getByLabelText } = renderDatePicker({
        defaultValue: '2021-01-20',
      })

      await userEvent.click(getByTestId('date-picker-button'))
      expect(getByTestId('date-picker-calendar')).toBeVisible()
      expect(getByTestId('date-picker')).toHaveClass('usa-date-picker--active')

      await waitFor(() => {
        expect(getByLabelText(/^20 January 2021/)).toHaveFocus()
      })
      expect(getByTestId('date-picker-status')).toHaveTextContent(
        'Selected date'
      )

      fireEvent.mouseMove(getByLabelText(/^13 January 2021/))

      expect(getByLabelText(/^13 January 2021/)).toHaveFocus()
      expect(getByTestId('date-picker-status')).not.toHaveTextContent(
        'Selected date'
      )

      fireEvent.mouseMove(getByLabelText(/^20 January 2021/))

      expect(getByLabelText(/^20 January 2021/)).toHaveFocus()
      expect(getByTestId('date-picker-status')).toHaveTextContent(
        'Selected date'
      )
    })
  })

  describe('with the required prop', () => {
    it('the external input is required, and the internal input is not required', () => {
      const { getByTestId } = renderDatePicker({ required: true })
      expect(getByTestId('date-picker-external-input')).toBeRequired()
      expect(getByTestId('date-picker-internal-input')).not.toBeRequired()
    })
  })

  describe('with the disabled prop', () => {
    it('the toggle button and external inputs are disabled, and the internal input is not disabled', () => {
      const { getByTestId } = renderDatePicker({ disabled: true })
      expect(getByTestId('date-picker-button')).toBeDisabled()
      expect(getByTestId('date-picker-external-input')).toBeDisabled()
      expect(getByTestId('date-picker-internal-input')).not.toBeDisabled()
    })

    it('does not show the calendar when the toggle button is clicked', async () => {
      const { getByTestId } = renderDatePicker({ disabled: true })
      await userEvent.click(getByTestId('date-picker-button'))
      expect(getByTestId('date-picker-calendar')).not.toBeVisible()
      expect(getByTestId('date-picker')).not.toHaveClass(
        'usa-date-picker--active'
      )
    })
  })

  describe('with a default value prop', () => {
    it('the internal input value is the date string, and the external input value is the formatted date', () => {
      const { getByTestId } = renderDatePicker({ defaultValue: '1988-05-16' })
      expect(getByTestId('date-picker-external-input')).toHaveValue(
        '05/16/1988'
      )
      expect(getByTestId('date-picker-internal-input')).toHaveValue(
        '1988-05-16'
      )
    })

    it('validates a valid default value', () => {
      const { getByTestId } = renderDatePicker({ defaultValue: '1988-05-16' })
      expect(getByTestId('date-picker-external-input')).toBeValid()
    })

    it('validates an invalid default value', () => {
      const { getByTestId } = renderDatePicker({
        defaultValue: '1990-01-01',
        minDate: '2020-01-01',
      })

      expect(getByTestId('date-picker-external-input')).toBeInvalid()
    })
  })

  describe('with localization props', () => {
    it('displays abbreviated translations for days of the week', async () => {
      const { getByText, getByTestId } = renderDatePicker({
        i18n: sampleLocalization,
      })
      await userEvent.click(getByTestId('date-picker-button'))
      sampleLocalization.daysOfWeekShort.forEach((translation) => {
        expect(getByText(translation)).toBeInTheDocument()
      })
    })
    it('displays translation for month', async () => {
      const { getByText, getByTestId } = renderDatePicker({
        defaultValue: '2020-02-01',
        i18n: sampleLocalization,
      })
      await userEvent.click(getByTestId('date-picker-button'))
      expect(getByText('febrero')).toBeInTheDocument()
    })
  })

  describe('selecting a date', () => {
    it('clicking a date button selects that date and closes the calendar and focuses the external input', async () => {
      const mockOnChange = jest.fn()
      const { getByText, getByTestId } = renderDatePicker({
        defaultValue: '2021-01-20',
        onChange: mockOnChange,
      })
      await userEvent.click(getByTestId('date-picker-button'))
      const dateButton = getByText('15')
      expect(dateButton).toHaveClass('usa-date-picker__calendar__date')
      await userEvent.click(dateButton)
      expect(getByTestId('date-picker-external-input')).toHaveValue(
        '01/15/2021'
      )
      expect(getByTestId('date-picker-internal-input')).toHaveValue(
        '2021-01-15'
      )
      expect(getByTestId('date-picker-calendar')).not.toBeVisible()
      expect(getByTestId('date-picker-external-input')).toHaveFocus()
      expect(mockOnChange).toHaveBeenCalledWith('01/15/2021')
    })

    it('selecting a date and opening the calendar focuses on the selected date', async () => {
      const { getByTestId, getByText } = renderDatePicker()

      // open calendar
      await userEvent.click(getByTestId('date-picker-button'))

      // select date
      const dateButton = getByText('12')
      await userEvent.click(dateButton)

      // open calendar again
      await userEvent.click(getByTestId('date-picker-button'))

      await waitFor(() => {
        expect(getByText('12')).toHaveFocus()
      })
      expect(getByText('12')).toHaveClass(
        'usa-date-picker__calendar__date--selected'
      )
    })
  })

  describe('typing in a date', () => {
    it('typing a date in the external input updates the selected date', async () => {
      const mockOnChange = jest.fn()
      const { getByTestId, getByText } = renderDatePicker({
        onChange: mockOnChange,
      })
      await userEvent.type(
        getByTestId('date-picker-external-input'),
        '05/16/1988'
      )
      await userEvent.click(getByTestId('date-picker-button'))
      expect(getByTestId('select-month')).toHaveTextContent('May')
      expect(getByTestId('select-year')).toHaveTextContent('1988')
      await waitFor(() => {
        expect(getByText('16')).toHaveFocus()
      })
      expect(getByText('16')).toHaveClass(
        'usa-date-picker__calendar__date--selected'
      )
      expect(mockOnChange).toHaveBeenCalledWith('05/16/1988')
    })

    it('typing a date with a 2-digit year in the external input focuses that year in the current century', async () => {
      const { getByTestId, getByLabelText } = renderDatePicker()
      await userEvent.type(getByTestId('date-picker-external-input'), '2/29/20')
      await userEvent.click(getByTestId('date-picker-button'))
      expect(getByTestId('select-month')).toHaveTextContent('February')
      expect(getByTestId('select-year')).toHaveTextContent('2020')

      await waitFor(() => {
        expect(getByLabelText(/^29 February 2020/)).toHaveFocus()
      })
    })

    it('typing a date with the calendar open updates the calendar to the entered date', async () => {
      const { getByTestId, getByText } = renderDatePicker({
        defaultValue: '2021-01-20',
      })
      await userEvent.click(getByTestId('date-picker-button'))
      expect(getByTestId('select-month')).toHaveTextContent('January')
      expect(getByTestId('select-year')).toHaveTextContent('2021')
      await userEvent.clear(getByTestId('date-picker-external-input'))
      await userEvent.type(
        getByTestId('date-picker-external-input'),
        '05/16/1988'
      )
      expect(getByTestId('select-month')).toHaveTextContent('May')
      expect(getByTestId('select-year')).toHaveTextContent('1988')
      expect(getByText('16')).toHaveClass(
        'usa-date-picker__calendar__date--selected'
      )
    })

    it('implements a custom onBlur handler', async () => {
      const mockOnBlur = jest.fn()
      const { getByTestId } = renderDatePicker({ onBlur: mockOnBlur })

      await userEvent.type(
        getByTestId('date-picker-external-input'),
        '05/16/1988'
      )
      getByTestId('date-picker-external-input').blur()
      expect(mockOnBlur).toHaveBeenCalled()
    })

    // TODO - this is an outstanding difference in behavior from USWDS. Fails because validation happens onChange.
    it.skip('typing in the external input does not validate until blurring', async () => {
      const { getByTestId } = renderDatePicker({
        minDate: '2021-01-20',
        maxDate: '2021-02-14',
      })

      const externalInput = getByTestId('date-picker-external-input')
      expect(externalInput).toBeValid()
      await userEvent.type(externalInput, '05/16/1988')
      expect(externalInput).toBeValid()
      externalInput.blur()
      expect(externalInput).toBeInvalid()
    })

    // TODO - this can be implemented if the above test case is implemented
    it.skip('pressing the Enter key in the external input validates the date', async () => {
      const { getByTestId } = renderDatePicker({
        minDate: '2021-01-20',
        maxDate: '2021-02-14',
      })

      const externalInput = getByTestId('date-picker-external-input')
      expect(externalInput).toBeValid()
      await userEvent.type(externalInput, '05/16/1988')
      expect(externalInput).toBeValid()
      await userEvent.type(externalInput, '{enter}')
      expect(externalInput).toBeInvalid()
    })
  })

  describe('validation', () => {
    it('entering an empty value is valid', async () => {
      const { getByTestId } = renderDatePicker()
      const externalInput = getByTestId(
        'date-picker-external-input'
      ) as HTMLInputElement
      await userEvent.type(externalInput, '{space}{backspace}')
      externalInput.blur()
      expect(externalInput).toHaveTextContent('')
      expect(externalInput).toBeValid()
      expect(externalInput.validationMessage).toEqual('')
    })

    it('entering a non-date value sets a validation message', async () => {
      const mockOnChange = jest.fn()
      const { getByTestId } = renderDatePicker({ onChange: mockOnChange })
      const externalInput = getByTestId(
        'date-picker-external-input'
      ) as HTMLInputElement
      await userEvent.type(
        externalInput,
        'abcdefg... That means the convo is done'
      )
      expect(mockOnChange).toHaveBeenCalledWith(
        'abcdefg... That means the convo is done'
      )

      expect(externalInput).toBeInvalid()
      expect(externalInput.validationMessage).toEqual(VALIDATION_MESSAGE)
    })

    it('entering a non-date value sets a validation message', async () => {
      const mockOnChange = jest.fn()
      const { getByTestId } = renderDatePicker({ onChange: mockOnChange })
      const externalInput = getByTestId(
        'date-picker-external-input'
      ) as HTMLInputElement
      await userEvent.type(externalInput, 'ab/cd/efg')
      expect(mockOnChange).toHaveBeenCalledWith('ab/cd/efg')

      expect(externalInput).toBeInvalid()
      expect(externalInput.validationMessage).toEqual(VALIDATION_MESSAGE)
    })

    it('entering an invalid date sets a validation message and becomes valid when selecting a date in the calendar', async () => {
      const mockOnChange = jest.fn()
      const { getByTestId, getByLabelText } = renderDatePicker({
        onChange: mockOnChange,
      })
      const externalInput = getByTestId(
        'date-picker-external-input'
      ) as HTMLInputElement
      await userEvent.type(externalInput, '2/31/2019')
      expect(mockOnChange).toHaveBeenCalledWith('2/31/2019')

      expect(externalInput).toBeInvalid()
      expect(externalInput.validationMessage).toEqual(VALIDATION_MESSAGE)
      await userEvent.click(getByTestId('date-picker-button'))
      expect(getByTestId('date-picker-calendar')).toBeVisible()
      await userEvent.click(getByLabelText(/^10 February 2019/))
      expect(mockOnChange).toHaveBeenCalledWith('02/10/2019')

      await waitFor(() => {
        expect(externalInput).toBeValid()
      })
      expect(externalInput.validationMessage).toEqual('')
    })

    it('entering a valid date outside of the min/max date sets a validation message', async () => {
      const mockOnChange = jest.fn()
      const { getByTestId } = renderDatePicker({
        minDate: '2021-01-20',
        maxDate: '2021-02-14',
        onChange: mockOnChange,
      })
      const externalInput = getByTestId(
        'date-picker-external-input'
      ) as HTMLInputElement
      await userEvent.type(externalInput, '05/16/1988')
      expect(mockOnChange).toHaveBeenCalledWith('05/16/1988')

      expect(externalInput).toBeInvalid()
      expect(externalInput.validationMessage).toEqual(VALIDATION_MESSAGE)
    })
  })

  describe('month selection', () => {
    it('clicking the selected month updates the status text', async () => {
      const { getByTestId } = renderDatePicker()
      await userEvent.click(getByTestId('date-picker-button'))
      await userEvent.click(getByTestId('select-month'))
      expect(getByTestId('date-picker-status')).toHaveTextContent(
        'Select a month'
      )
    })
  })

  describe('year selection', () => {
    it('clicking the selected year updates the status text', async () => {
      const { getByTestId } = renderDatePicker({ defaultValue: '2021-01-20' })
      await userEvent.click(getByTestId('date-picker-button'))
      await userEvent.click(getByTestId('select-year'))

      await waitFor(() => {
        expect(getByTestId('date-picker-status')).toHaveTextContent(
          'Showing years 2016 to 2027. Select a year.'
        )
      })
    })

    it('clicking previous year chunk updates the status text', async () => {
      const { getByTestId } = renderDatePicker({ defaultValue: '2021-01-20' })
      await userEvent.click(getByTestId('date-picker-button'))
      await userEvent.click(getByTestId('select-year'))
      await userEvent.click(getByTestId('previous-year-chunk'))

      await waitFor(() => {
        expect(getByTestId('date-picker-status')).toHaveTextContent(
          'Showing years 2004 to 2015. Select a year.'
        )
      })
    })

    it('clicking next year chunk navigates the year picker forward one chunk', async () => {
      const { getByTestId } = renderDatePicker({ defaultValue: '2021-01-20' })
      await userEvent.click(getByTestId('date-picker-button'))
      await userEvent.click(getByTestId('select-year'))
      await userEvent.click(getByTestId('next-year-chunk'))

      await waitFor(() => {
        expect(getByTestId('date-picker-status')).toHaveTextContent(
          'Showing years 2028 to 2039. Select a year.'
        )
      })
    })
  })

  describe('validationStatus', () => {
    it('renders with error styling', () => {
      const { getByTestId } = renderDatePicker({ validationStatus: 'error' })
      expect(getByTestId('date-picker-external-input')).toBeInstanceOf(
        HTMLInputElement
      )
      expect(getByTestId('date-picker-external-input')).toHaveClass(
        'usa-input--error'
      )
    })

    it('renders with success styling', () => {
      const { getByTestId } = renderDatePicker({ validationStatus: 'success' })
      expect(getByTestId('date-picker-external-input')).toBeInstanceOf(
        HTMLInputElement
      )
      expect(getByTestId('date-picker-external-input')).toHaveClass(
        'usa-input--success'
      )
    })
  })
})
