/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { fireEvent, screen, waitFor } from '@testing-library/dom'
import NewBillUI from '../views/NewBillUI.js'
import NewBill from '../containers/NewBill.js'
import { ROUTES, ROUTES_PATH } from '../constants/routes'
import { localStorageMock } from '../__mocks__/localStorage.js'
import userEvent from '@testing-library/user-event'
import mockStore from '../__mocks__/store.js'
import router from '../app/Router.js'

// mock the store we are going to use
jest.mock('../app/store', () => mockStore)

describe('Given I am connected as an employee', () => {
  beforeEach(() => {
    // display datas of employee
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem(
      'user',
      JSON.stringify({
        type: 'Employee',
        email: 'a@a',
      })
    )
  })
  describe('When I am on NewBill Page', () => {
    // icon should be highlighted
    test('Then mail icon in vertical layout should be highlighted', async () => {
      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail') 
      expect(mailIcon).toHaveClass('active-icon') 
    })
    // the form must be present on the screen with all its fields
    test('Then the form should be displayed', () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
      expect(screen.getByTestId('expense-type')).toBeTruthy()
      expect(screen.getByTestId('expense-name')).toBeTruthy()
      expect(screen.getByTestId('datepicker')).toBeTruthy()
      expect(screen.getByTestId('amount')).toBeTruthy()
      expect(screen.getByTestId('vat')).toBeTruthy()
      expect(screen.getByTestId('pct')).toBeTruthy()
      expect(screen.getByTestId('commentary')).toBeTruthy()
      expect(screen.getByTestId('file')).toBeTruthy()
      expect(screen.getByRole('button')).toBeTruthy()
    })
    //tesst upload
    describe('When I upload a file', () => {
      // clear all mocks before and after each test, ensure each test runs with the correct mock
      beforeEach(() => {
        jest.clearAllMocks()
      })
      afterEach(() => {
        jest.clearAllMocks()
      })
      test('Then, I can select a png, jpg or jpeg file', () => {
        const html = NewBillUI()
        document.body.innerHTML = html
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const newBillContainer = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })

        const changeFile = jest.fn((e) => newBillContainer.handleChangeFile(e)) // function test
        const file = screen.getByTestId('file')
        expect(file).toBeTruthy()

        const testFile = new File(['sample.jpg'], 'sample.jpg', {
          type: 'image/jpg',
        }) // create file to test

        file.addEventListener('change', changeFile) // event listener chnage for function
        userEvent.upload(file, testFile) // upload file test

        expect(changeFile).toHaveBeenCalled() // the function is expected to have been called
        expect(file.files[0]).toEqual(testFile) // the uploaded file is the test file
        expect(file.files[0].name).toBe('sample.jpg') // the file name corresponds to the test file

        jest.spyOn(window, 'alert').mockImplementation(() => {}) // mock call alert
        expect(window.alert).not.toHaveBeenCalled() // expects the alert was not called
      })
      // we cannot upload a file that is not an image
      test("Then, I can't select a non-image file, and the page displays an alert", () => {
        const html = NewBillUI()
        document.body.innerHTML = html
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const newBillContainer = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })

        const changeFile = jest.fn(newBillContainer.handleChangeFile)
        const file = screen.getByTestId('file')
        expect(file).toBeTruthy()

        const testFile = new File(['sample test file'], 'sample.txt', {
          type: 'text/plain',
        }) // create file text

        file.addEventListener('change', changeFile)
        userEvent.upload(file, testFile) // upload le fichier test

        expect(changeFile).toHaveBeenCalled()
        expect(file.files[0].name).not.toBe('sample.png')
        expect(file.files[0].type).not.toBe('image/png')

        jest.spyOn(window, 'alert').mockImplementation(() => {})
        expect(window.alert).toHaveBeenCalled()
        expect(file.value).toBe('')
      })
    })
  })
})

//Test d'intégration POST
describe('Given I am a user connected as Employee', () => {
  describe('When I submit a completed form', () => {
    test('Then a new bill should be created', async () => {
      const html = NewBillUI()
      document.body.innerHTML = html

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
          email: 'azerty@email.com',
        })
      )

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })
      // create data of bill
      const sampleBill = {
        type: 'Hôtel et logement',
        name: 'encore',
        date: '2004-04-04',
        amount: 400,
        vat: 80,
        pct: 20,
        commentary: 'séminaire billed',
        fileUrl:
          'https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a',
        fileName: 'preview-facture-free-201801-pdf-1.jpg',
        status: 'pending',
      }

      // charge les données dans les champs correspondants
      screen.getByTestId('expense-type').value = sampleBill.type
      screen.getByTestId('expense-name').value = sampleBill.name
      screen.getByTestId('datepicker').value = sampleBill.date
      screen.getByTestId('amount').value = sampleBill.amount
      screen.getByTestId('vat').value = sampleBill.vat
      screen.getByTestId('pct').value = sampleBill.pct
      screen.getByTestId('commentary').value = sampleBill.commentary

      newBill.fileName = sampleBill.fileName
      newBill.fileUrl = sampleBill.fileUrl
      newBill.updateBill = jest.fn()
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))

      const form = screen.getByTestId('form-new-bill')
      form.addEventListener('submit', handleSubmit)
      fireEvent.submit(form)

      expect(handleSubmit).toHaveBeenCalled()
      expect(newBill.updateBill).toHaveBeenCalled()
    })
    // test erreur API
    test('fetches error from an API and fails with 500 error', async () => {
      jest.spyOn(mockStore, 'bills')
      jest.spyOn(console, 'error').mockImplementation(() => {}) // prevent errror
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      Object.defineProperty(window, 'location', {
        value: { hash: ROUTES_PATH['NewBill'] },
      })

      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = `<div id="root"></div>`
      router()

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      mockStore.bills.mockImplementationOnce(() => {
        return {
          update: () => {
            return Promise.reject(new Error('Erreur 500'))
          },
        }
      })
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })

      // Submit form
      const form = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      form.addEventListener('submit', handleSubmit)
      fireEvent.submit(form)
      await new Promise(process.nextTick)
      expect(console.error).toBeCalled()
    })
  })
})