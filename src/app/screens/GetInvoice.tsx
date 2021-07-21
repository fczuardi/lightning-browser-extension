import React, { useState, useEffect } from "react";
import axios from "axios";
import { bech32 } from "bech32";

import msg from "../../common/lib/msg";

import Button from "../components/button";
import PublisherCard from "../components/PublisherCard";

type Props = {
  lnurlEncoded: string;
  origin: {
    name: string;
    icon: string;
  };
};

function GetInvoice({ lnurlEncoded, origin }: Props) {
  const [metadata, setMetadata] = useState(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const { words: dataPart } = bech32.decode(lnurlEncoded, 2000);
        const requestByteArray = bech32.fromWords(dataPart);
        const lnurl = Buffer.from(requestByteArray).toString();
        const { data } = await axios.get(lnurl);
        setMetadata(data);
        setValue(data.minSendable);
      } catch (e) {
        console.log(e.message);
      }
    }

    fetchMetadata();
  }, [lnurlEncoded]);

  async function confirm() {
    try {
      const res = await axios.get(metadata.callback, {
        params: { amount: value },
      });
      return await msg.reply({
        confirmed: true,
      });
    } catch (e) {
      console.log(e.message);
    }
  }

  function reject(e) {
    e.preventDefault();
    msg.error("User rejected");
  }

  function renderAmount() {
    if (metadata.minSendable === metadata.maxSendable) {
      return <p>Pay {metadata.minSendable} satoshi</p>;
    } else {
      return (
        <div>
          <input
            type="range"
            min={metadata.minSendable}
            max={metadata.maxSendable}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <output>{value} satoshi</output>
        </div>
      );
    }
  }

  return (
    <div>
      <PublisherCard title={origin.name} image={origin.icon} />
      <div className="p-6 text-center">
        {metadata && (
          <>
            <div className="mb-6">{renderAmount()}</div>
            <div>
              <div className="mb-5">
                <Button onClick={confirm} label="Confirm" fullWidth />
              </div>

              <p className="mb-3 underline text-sm text-gray-300">
                Only connect with sites you trust.
              </p>

              <a
                className="underline text-sm text-gray-500"
                href="#"
                onClick={reject}
              >
                Cancel
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default GetInvoice;
