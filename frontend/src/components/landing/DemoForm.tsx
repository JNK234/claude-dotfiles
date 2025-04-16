import React from 'react';
import { useForm } from 'react-hook-form';

type FormData = {
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  email: string;
  phone: string;
  country: string;
};

function DemoForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    console.log(data);
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg mx-auto">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-darkText">
            First Name
          </label>
          <input
            type="text"
            {...register('firstName', { required: 'First name is required' })}
            className="mt-1 block w-full rounded-md border-borderColor shadow-sm focus:border-yellow focus:ring-yellow"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-errorRed">{errors.firstName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-darkText">
            Last Name
          </label>
          <input
            type="text"
            {...register('lastName', { required: 'Last name is required' })}
            className="mt-1 block w-full rounded-md border-borderColor shadow-sm focus:border-yellow focus:ring-yellow"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-errorRed">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-medium text-darkText">
          Company
        </label>
        <input
          type="text"
          {...register('company', { required: 'Company is required' })}
          className="mt-1 block w-full rounded-md border-borderColor shadow-sm focus:border-yellow focus:ring-yellow"
        />
        {errors.company && (
          <p className="mt-1 text-sm text-errorRed">{errors.company.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="jobTitle" className="block text-sm font-medium text-darkText">
          Job Title
        </label>
        <input
          type="text"
          {...register('jobTitle', { required: 'Job title is required' })}
          className="mt-1 block w-full rounded-md border-borderColor shadow-sm focus:border-yellow focus:ring-yellow"
        />
        {errors.jobTitle && (
          <p className="mt-1 text-sm text-errorRed">{errors.jobTitle.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-darkText">
          Email
        </label>
        <input
          type="email"
          {...register('email', { 
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
          className="mt-1 block w-full rounded-md border-borderColor shadow-sm focus:border-yellow focus:ring-yellow"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-errorRed">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-darkText">
          Phone Number
        </label>
        <input
          type="tel"
          {...register('phone', { required: 'Phone number is required' })}
          className="mt-1 block w-full rounded-md border-borderColor shadow-sm focus:border-yellow focus:ring-yellow"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-errorRed">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="country" className="block text-sm font-medium text-darkText">
          Country
        </label>
        <input
          type="text"
          {...register('country', { required: 'Country is required' })}
          className="mt-1 block w-full rounded-md border-borderColor shadow-sm focus:border-yellow focus:ring-yellow"
        />
        {errors.country && (
          <p className="mt-1 text-sm text-errorRed">{errors.country.message}</p>
        )}
      </div>

      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-darkBlue hover:bg-yellow hover:text-darkBlue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow"
        >
          Submit
        </button>
      </div>
    </form>
  );
}

export default DemoForm;