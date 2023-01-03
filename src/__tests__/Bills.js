/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom"
import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js";
import userEvent from '@testing-library/user-event'
import Bills from '../containers/Bills.js';
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { bills } from "../fixtures/bills.js";
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
        document, onNavigate, store: null, bills: bills, localStorage: window.localStorage
      })
      document.body.innerHTML = BillsUI({ data: { bills } })

      const openNewBillPage = jest.fn(billsContainer.handleClickNewBill); // create the function to test
      const buttonNewBill = screen.getByTestId("btn-new-bill"); // get the new expense report button

      buttonNewBill.addEventListener('click', openNewBillPage); // trigger the vent click
      userEvent.click(buttonNewBill); // mock the click

      expect(openNewBillPage).toHaveBeenCalled(); // we expected that the function has been called and therefore the page loaded
      expect(screen.getByTestId('form-new-bill')).toBeTruthy(); // then check that the form is indeed present on the page
    })

    test('Then, it should open the modal', () => {

      $.fn.modal = jest.fn(); // empêche erreur jQuery

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))

      document.body.innerHTML = BillsUI({ data: bills })

      const billsContainer = new Bills({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      });

      const iconView = screen.getAllByTestId('icon-eye')[0]

      const openViewModal = jest.fn(billsContainer.handleClickIconEye(iconView))

      iconView.addEventListener('click', openViewModal)
      userEvent.click(iconView)

      expect(openViewModal).toHaveBeenCalled(); // we expected that the function has been called and therefore the page loaded
      const modale = screen.getByTestId('modaleFile'); // we added a data-testid to the modal in BillsUI that we get
      expect(modale).toBeTruthy(); // the modal is expected to be present
    })

    // * test d'intégration GET
    describe("Given I am a user connected as Employee", () => {
      describe("When I navigate to Bills", () => {

        global.fetch = jest.fn(() => list())

        // clear tous les mocks avant et après chaque test, assure que chaque test tourne bien avec le mock correct
        beforeEach(() => {
          jest.clearAllMocks()
        })
        afterEach(() => {
          jest.clearAllMocks()
        })

        test("fetches bills from mock API GET", async () => {
          localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
          const root = document.createElement("div")
          root.setAttribute("id", "root")
          document.body.append(root)
          router()
          window.onNavigate(ROUTES_PATH.Bills)
          await waitFor(() => screen.getByText("Mes notes de frais"));
          expect(screen.getByTestId("btn-new-bill")).toBeTruthy();
        })

        describe("When an error occurs on API", () => {
          beforeEach(() => {
            jest.spyOn(mockStore, "bills")
            Object.defineProperty(
              window,
              'localStorage',
              { value: localStorageMock }
            )
            window.localStorage.setItem('user', JSON.stringify({
              type: 'Employee',
              email: "a@a"
            }))
            const root = document.createElement("div")
            root.setAttribute("id", "root")
            document.body.appendChild(root)
            router()
          })
          test("fetches bills from an API and fails with 404 message error", async () => {
            mockStore.bills.mockImplementationOnce(() => {
              return {
                list: () => {
                  return Promise.reject(new Error("Erreur 404"))
                }
              }
            })
            window.onNavigate(ROUTES_PATH.Bills)
            await new Promise(process.nextTick);
            const message = screen.getByText(/Erreur 404/)
            expect(message).toBeTruthy()
          })

          test("fetches messages from an API and fails with 500 message error", async () => {
            mockStore.bills.mockImplementationOnce(() => {
              return {
                list: () => {
                  return Promise.reject(new Error("Erreur 500"))
                }
              }
            })

            window.onNavigate(ROUTES_PATH.Bills)
            await new Promise(process.nextTick);
            const message = screen.getByText(/Erreur 500/)
            expect(message).toBeTruthy()
          })
        })
      })
    })
  })
})
