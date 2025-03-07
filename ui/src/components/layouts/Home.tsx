import { Field, Form, Formik } from 'formik';
import './common.css'
import { useStateTransition } from '../../hooks/useStateTransition';
import { object, string } from 'yup';
import { Button, getIconSvg, SwipeUpScreenTab, TextInputField } from 'habit-fract-design-system';
import { ListSpheres } from '../lists';
import { motion } from 'framer-motion';
import { Popover, ListGroup } from 'flowbite-react';
import { BUTTON_ACTION_TEXT, ERROR_MESSAGES, PAGE_COPY } from '../../constants';

function HomeLayout({ firstVisit = true }: any) {
  const [_, transition] = useStateTransition(); // Top level state machine and routing
  const validationSchema = object({
    password: string()
      .min(8, ERROR_MESSAGES['password-short'])
      .max(18, ERROR_MESSAGES['password-long'])
      .required(ERROR_MESSAGES['password-empty'])
  });

  const routeToSettings = () => transition("Settings");

  return (
    <section className="home-layout">
      {firstVisit
        ? <header className="welcome-cta">
          <img
            className="logo"
            src="assets/logo.svg"
            alt='Planitt logo'
          />
          <h2>{PAGE_COPY['slogan']}</h2>
          <div className="flex items-center justify-center w-full gap-4">
            {[1, 2, 3, 4, 5].map(num => <img key={num} src={`/assets/icons/sphere-symbol-${num}.svg`}></img>)}
          </div>
        </header>
        : <header className="returning-cta">
          <div>
            <img
              className="logo"
              src="assets/logo.svg"
              alt='Planitt logo'
            />
            <div className="avatar-menu mt-2">
              <Popover
                content={<ListGroup
                  className="list-group-override w-32">
                  <ListGroup.Item disabled={true} onClick={() => { }} icon={getIconSvg('user')}>Profile</ListGroup.Item>
                  <ListGroup.Item onClick={routeToSettings} icon={getIconSvg('settings')}>Settings</ListGroup.Item>
                </ListGroup>
                }
              >
                <Button type='button' variant='circle-icon-lg'>
                  <img
                    src="assets/icons/avatar-placeholder.svg"
                    alt='Avatar Placeholder'
                  />
                </Button>
              </Popover>
            </div>
          </div>
          <span>
            <h1>Welcome back! 👋</h1>
            <h2>{PAGE_COPY['slogan']} <em>I plan...</em></h2>
          </span>
          <div className="text-text dark:text-text-dark flex justify-around h-12 gap-4">
            <Button onClick={() => { transition("Onboarding1", { spin: 'positive' }) }} type="button" variant="primary responsive">
              <span className="text-success-500 dark:text-success-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  stroke="currentColor"
                  viewBox="144 144 512 512"
                  className="w-8 h-8 my-1 mr-2 opacity-75"
                >
                  <path d="M400 287a113 113 0 1 0 0 226 113 113 0 0 0 0-226zm59 128h-44v44a15 15 0 1 1-30 0v-44h-44a15 15 0 1 1 0-30h44v-44a15 15 0 1 1 30 0v44h44a15 15 0 1 1 0 30z" />
                  <path d="M578 222a252 252 0 0 0-356 356 252 252 0 0 0 356-356zM400 543a143 143 0 1 1 0-286 143 143 0 0 1 0 286z" />
                </svg>
              </span>{BUTTON_ACTION_TEXT['positive-spin-cta']}</Button>
            <Button isDisabled={true} onClick={() => { transition("CreateSphere", { spin: 'negative' }) }} type="button" variant="primary responsive"><span className="text-success-500"><img src="assets/icons/negative-spin.svg" className='w-8 h-8 my-1 mr-2 opacity-75' /></span>{BUTTON_ACTION_TEXT['negative-spin-cta']}</Button>
          </div>
        </header>
      }
      {firstVisit
        ? <div className="login-options">
          <Formik
            initialValues={{ password: "password" }}
            validationSchema={validationSchema}
            onSubmit={(values, { setSubmitting }) => {
              try {
                if (values.password) {
                  transition("Onboarding1");
                }
              } catch (error) {
                console.error(error);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, submitForm }) => {
              return <Form noValidate>
                <div className="form-field gap-8">
                  <Field
                    disabled
                    component={TextInputField}
                    size="base"
                    name="password"
                    id="password"
                    withInfo={true}
                    isPassword={true}
                    onClickInfo={() => ({
                      title: "Why don't I have traditional login options?",
                      body: "This is what we call a Web 3 application - congratulations on being a part of the next web! //As a consequence there is no corporate cloud login, and all you need to be secure is a safe password.//Entering it again here is how you activate your public and private keys - your digital signature in the Planitt universe.// Write it somewhere and store it securely, since there is no password retrieval: you are responsible for your own keys.",
                    })}
                    required={true}
                    labelValue={"Password:"}
                    placeholder={"Enter your password"}
                  />
                <Button type={"button"} isDisabled={isSubmitting} variant={"primary"} onClick={() => submitForm()}>
                  Sign In
                </Button>

                </div>

                <div className="text-text dark:text-text-dark opacity-80 flex items-center justify-center gap-8 mt-2 text-base text-center">
                  <div>
                    <h3>Powered by</h3>
                    <img
                      className="w-80"
                      src="assets/holochain-logo.png"
                      alt='Holochain logo'
                    />
                  </div>
                  <p>{PAGE_COPY['password-notice']}</p>
                </div>
              </Form>
            }}
          </Formik>
        </div>
        :
        <SwipeUpScreenTab verticalOffset={(12 * 16) + 8} useViewportHeight={false}>
          {({ bindDrag }) => (
            <motion.div {...bindDrag} className="spaces-tab">
              <motion.div className="handle" {...bindDrag} style={{ touchAction: 'none', cursor: 'grab' }}>
                <span></span>
              </motion.div>

              <ListSpheres></ListSpheres>
            </motion.div>
          )}
        </SwipeUpScreenTab>
      }
    </section>
  );
}

export default HomeLayout;
