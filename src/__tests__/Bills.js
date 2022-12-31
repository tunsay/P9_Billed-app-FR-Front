/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom"
import userEvent from '@testing-library/user-event'
import {screen, waitFor, fireEvent} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js";
import Bills from '../containers/Bills.js';
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //The classlist active-icon will higlight the icon
      expect(windowIcon).toHaveClass('active-icon')
    })

    test("Then bills should be ordered from earliest to latest", () => {

      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test('Then i click in the button new bill, the path "new bill" should be defined', () => {
      // define the path
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      //show page data
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'employee'
      }))

      const billsContainer = new Bills({
        document, onNavigate, store: null, bills:bills, localStorage: window.localStorage
      })
      document.body.innerHTML = BillsUI({ data: { bills } })

      const openNewBillPage = jest.fn(billsContainer.handleClickNewBill); // create the function to test
      const buttonNewBill = screen.getByTestId("btn-new-bill"); // get the new expense report button

      buttonNewBill.addEventListener('click', openNewBillPage); // trigger the vent click
      userEvent.click(buttonNewBill); // mock the click

      expect(openNewBillPage).toHaveBeenCalled(); // we expected that the function has been called and therefore the page loaded
      expect(screen.getByTestId('form-new-bill')).toBeTruthy(); // then check that the form is indeed present on the page
    })

    test('Then, Loading page should be rendered', () => {
      document.body.innerHTML = BillsUI({ loading: true })
      expect(screen.getAllByText('Loading...')).toBeTruthy()
    })
    
  })
})
