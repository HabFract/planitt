import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { DateTime } from "luxon"

import { Checkbox, Flex } from 'antd';
import DateInput from './input/DatePicker';
import { Button, TextInput, Label, Select, Textarea } from 'flowbite-react';

import { Frequency, Orbit, OrbitCreateUpdateParams, Scale, useCreateOrbitMutation, useGetOrbitQuery, useGetOrbitsQuery, useUpdateOrbitMutation } from '../../graphql/generated';
import { extractEdges } from '../../graphql/utils';
import { CustomErrorLabel } from './CreateSphere';
import { ActionHashB64 } from '@holochain/client';
import { useStateTransition } from '../../hooks/useStateTransition';

// Define the validation schema using Yup
const OrbitValidationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  description: Yup.string(),
  startTime: Yup.number().min(0).required("Start date/time is required"),
  endTime: Yup.number(),
  frequency: Yup.mixed()
    .oneOf(Object.values(Frequency))
    .required('Choose a frequency'),
  scale: Yup.mixed()
    .oneOf(Object.values(Scale))
    .required('Choose a scale'),
  parentHash: Yup.string(),
  archival: Yup.boolean(),
});
interface CreateOrbitProps {
  editMode: boolean;
  orbitToEditId?: ActionHashB64;
  sphereEh: string; // Link to a sphere
  parentOrbitEh: string | undefined; // Link to a parent Orbit to create hierarchies
}
const OrbitFetcher = ({orbitToEditId}) => {
  const { setValues } = useFormikContext();

  const {data: getData, error: getError, loading: getLoading } = useGetOrbitQuery({
    variables: {
      id: orbitToEditId as string
    },
  });

  useEffect(() => {
      const {  name, sphereHash: parentHash, frequency, scale, metadata: {description, timeframe:  {startTime, endTime} }} = getData!.orbit as any;
      
      setValues({
        name, description, startTime, endTime: endTime || undefined, frequency, scale, archival: !!endTime, parentHash
      })
  }, [getData])
  return null;
};

const CreateOrbit: React.FC<CreateOrbitProps> = ({ editMode = false, orbitToEditId, sphereEh, parentOrbitEh }: CreateOrbitProps) => {
  const [state, transition] = useStateTransition(); // Top level state machine and routing

  const [addOrbit] = useCreateOrbitMutation({
    refetchQueries: [
      'getOrbits',
    ]
  });
  const [updateOrbit] = useUpdateOrbitMutation({
    refetchQueries: [
      'getOrbits',
    ],
  }
  );

  const { data: orbits, loading, error } = useGetOrbitsQuery({ variables: { sphereEntryHashB64: sphereEh } });

  const [orbitValues, _] = useState<OrbitCreateUpdateParams & any>({
    name: '',
    description: '',
    startTime: DateTime.now().ts,
    endTime: DateTime.now().ts,
    frequency: Frequency.Day,
    scale: Scale.Astro,
    archival: false,
    parentHash: ''
  });
  return (
    <div className="form-container">
      <h2 className="form-title">{editMode ? "Update" : "Create"} Orbit</h2>
      <Formik
        initialValues={orbitValues}
        validationSchema={OrbitValidationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            if (!values.archival) delete values.endTime;
            delete values.archival;
            editMode
              ? await updateOrbit({ variables: { orbitFields: { id: orbitToEditId, ...values, sphereHash: sphereEh, parentHash: parentOrbitEh ? parentOrbitEh : values.parentHash || undefined } } })
              : await addOrbit({ variables: { variables: { ...values, sphereHash: sphereEh, parentHash: parentOrbitEh ? parentOrbitEh : values.parentHash || undefined } } })
            setSubmitting(false);

            transition('Home')
          } catch (error) {
            console.error(error);
          }
        }}
        >
        {({ values, errors, touched }) => (
          <Form noValidate={true}>
            {editMode && <OrbitFetcher orbitToEditId={orbitToEditId} />}
            <div className="field">
              <Label htmlFor='name'>Name: <span className="reqd">*</span></Label>

              <div className="flex flex-col gap-2">
                <Field as={TextInput} color={"default"} sizing="lg" autoComplete={'off'} type="text" name="name" id="name" required />
                {CustomErrorLabel('name', errors, touched)}
              </div>
            </div>

            <div className="field">
              <Label htmlFor='description'>Description:</Label>
              <div className="flex flex-col gap-2">
                <Field as={Textarea} color={"default"} autoComplete={'off'} type="text" name="description" id="description" />
                {CustomErrorLabel('description', errors, touched)}
              </div>
            </div>


            <div className="field">
              <Label htmlFor='parentHash'>Parent Orbit: <span className="reqd">*</span></Label>

              <div className="flex flex-col gap-2">
                <Field type="text" name="parentHash">
                {({ field }) => (
                  <Select 
                  {...field}
                  disabled={!!editMode}
                    color={errors.parentHash && touched.parentHash ? "invalid" : "default"}
                  >
                    <option value={'root'}>{'None'}</option>
                    {(extractEdges((orbits as any)?.orbits) as Orbit[]).map((orbit, i) =>
                      <option key={i} value={orbit.eH}>{orbit.name}</option>
                    )
                    }
                  </Select>
                )}
              </Field>
                {CustomErrorLabel('parentHash', errors, touched)}
              </div>
            </div>

            <div className="field">
              <Label htmlFor='frequency'>Frequency: <span className="reqd">*</span>
              </Label>
              <div className="flex flex-col gap-2">
                <Field name="frequency" >
                  {({ field }) => (
                    <Select
                      {...field}
                      color={errors.frequency && touched.frequency ? "invalid" : "default"}
                    >
                      {Object.values(Frequency).map((freq, i) =>
                        <option key={i} value={freq}>{freq}</option>
                      )
                      }
                    </Select>
                  )}
                </Field>
                {CustomErrorLabel('frequency', errors, touched)}
              </div>
            </div>

            <div className="field">
              <Label htmlFor='scale'>Scale: <span className="reqd">*</span></Label>
              <div className="flex flex-col gap-2">
                <Field name="scale" >
                  {({ field }) => (
                    <Select
                      {...field}
                      color={errors.scale && touched.scale ? "invalid" : "default"}
                    >
                      {Object.values(Scale).map((scale, i) =>
                        <option key={i} value={scale}>{scale}</option>
                      )
                      }
                    </Select>
                  )}
                </Field>
                {CustomErrorLabel('scale', errors, touched)}
              </div>
            </div>

            <Flex className={"field"} vertical={true}>
              <Flex justify='space-around'>
                <Label htmlFor='startTime'>Start<span className="reqd">*</span><span className="hidden-sm">/</span>
                </Label>
                <Label htmlFor='endTime'>&nbsp; End:
                </Label>
              </Flex>
              <div className="flex flex-wrap items-start">
                <div className="flex flex-col gap-2 flex-1">
                  <Field
                    name="startTime"
                    id="startTime"
                    type="date"
                    placeholder={"Select:"}
                    component={DateInput}
                    defaultValue={values.startTime}
                  />
                </div>
                <div className="flex flex-col md:flex-row gap-2 mb-4 justify-around flex-1">
                  <Field
                    name="endTime"
                    id="endTime"
                    type="date"
                    placeholder={"Select:"}
                    component={DateInput}
                    disabled={(!values.archival)}
                    defaultValue={values.endTime}
                  />
                  <Field name="archival">
                    {({ field }) => (
                      <Checkbox
                        className="text-sm text-light-gray"
                        {...field}
                      // onChange={async (e) => {  setFieldValue('archival', e.target.checked) }}
                      >Archival?</Checkbox>
                    )}
                  </Field>
                </div>
              </div>
            </Flex>

            <Button type="submit" disabled={!!Object.values(errors).length || (Object.values(touched).filter(value => value).length < 1)} className={editMode ? "btn-warn" : "btn-primary"}>{editMode ? "Update" : "Create"}</Button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CreateOrbit;
